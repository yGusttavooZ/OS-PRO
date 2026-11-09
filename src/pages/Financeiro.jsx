import { useEffect, useMemo, useState } from "react";
import { Plus, Loader2, Wallet, TrendingUp, TrendingDown, Check, Trash2, Pencil, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import FinanceChart from "@/components/dashboard/FinanceChart";
import TransactionDialog from "@/components/finance/TransactionDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useTenant } from "@/lib/TenantContext";
import { invalidateTenantCache, paged } from "@/lib/tenant";
import { brl, monthLabel, periodRange, shortDate } from "@/lib/format";

const PERIODS = [
  { value: "this_month", label: "Este mês" },
  { value: "last_month", label: "Mês anterior" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "year", label: "Este ano" },
];

const STATUS_LABELS = {
  pending: "Pendente",
  received: "Recebido",
  paid: "Pago",
  canceled: "Cancelado",
};

export default function Financeiro() {
  const { company, can, user } = useTenant();
  const [period, setPeriod] = useState("this_month");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [rows, setRows] = useState([]);
  const [chartRows, setChartRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const { from, to } = periodRange(period);

  const load = async () => {
    if (!company?.id) return;
    setLoading(true);
    setError("");
    try {
      const [periodRows, historyRows] = await Promise.all([
        paged("Transaction", {
          company_id: company.id,
          reference_date: { $gte: from.slice(0, 10), $lte: to.slice(0, 10) },
        }, { sort: "-reference_date", limit: 400 }),
        paged("Transaction", { company_id: company.id }, { sort: "-reference_date", limit: 400 }),
      ]);
      setRows(periodRows);
      setChartRows(historyRows);
    } catch (err) {
      setError(err?.message || "Não foi possível carregar os lançamentos financeiros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [company?.id, period]);

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (type !== "all" && row.type !== type) return false;
        if (status !== "all" && row.status !== status) return false;
        return true;
      }),
    [rows, type, status]
  );

  const totals = useMemo(() => {
    let received = 0;
    let pendingIn = 0;
    let paid = 0;
    let pendingOut = 0;
    for (const row of rows) {
      const amount = Number(row.amount) || 0;
      if (row.type === "income" && row.status === "received") received += amount;
      if (row.type === "income" && row.status === "pending") pendingIn += amount;
      if (row.type === "expense" && row.status === "paid") paid += amount;
      if (row.type === "expense" && row.status === "pending") pendingOut += amount;
    }
    return { received, pendingIn, paid, pendingOut, balance: received - paid };
  }, [rows]);

  const chartData = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${date.getFullYear()}-${date.getMonth()}`, month: monthLabel(date), receita: 0, despesa: 0 });
    }
    for (const row of chartRows) {
      const raw = row.reference_date || row.paid_date || row.created_date;
      if (!raw) continue;
      const date = new Date(raw);
      const bucket = buckets.find((item) => item.key === `${date.getFullYear()}-${date.getMonth()}`);
      if (!bucket) continue;
      const amount = Number(row.amount) || 0;
      if (row.type === "income" && row.status === "received") bucket.receita += amount;
      if (row.type === "expense" && row.status === "paid") bucket.despesa += amount;
    }
    return buckets;
  }, [chartRows]);

  const confirm = async (row) => {
    setError("");
    try {
      await base44.entities.Transaction.update(row.id, {
        status: row.type === "income" ? "received" : "paid",
        paid_date: new Date().toISOString().slice(0, 10),
      });
      invalidateTenantCache("Transaction");
      await load();
    } catch (err) {
      setError(err?.message || "Não foi possível confirmar o lançamento.");
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Excluir o lançamento "${row.description || "sem descrição"}"? Esta ação não pode ser desfeita.`)) return;
    setError("");
    try {
      await base44.entities.Transaction.delete(row.id);
      invalidateTenantCache("Transaction");
      await load();
    } catch (err) {
      setError(err?.message || "Não foi possível excluir o lançamento.");
    }
  };

  if (!can.finance) {
    return (
      <div className="surface p-8 max-w-lg mx-auto text-center">
        <span className="w-12 h-12 rounded-2xl bg-muted grid place-items-center mx-auto text-muted-foreground">
          <Wallet className="w-5 h-5" />
        </span>
        <h1 className="mt-4 font-heading font-bold text-lg">Acesso restrito</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O módulo financeiro é exclusivo dos administradores da empresa.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Seu perfil: {user?.company_role || "sem perfil"}</p>
      </div>
    );
  }

  const kpis = [
    { label: "Recebido", value: totals.received, tone: "text-emerald-700", icon: TrendingUp },
    { label: "A receber", value: totals.pendingIn, tone: "text-amber-600", icon: ArrowDownLeft },
    { label: "Pago", value: totals.paid, tone: "text-rose-600", icon: TrendingDown },
    { label: "A pagar", value: totals.pendingOut, tone: "text-rose-500", icon: ArrowUpRight },
  ];

  return (
    <div>
      <PageHeader
        title="Financeiro"
        subtitle="Entradas, saídas e saldo da empresa por período."
        actions={
          <>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[160px] bg-card h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERIODS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="h-10 gap-2"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4" /> Novo lançamento
            </Button>
          </>
        }
      />

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="surface p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{kpi.label}</p>
              <kpi.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className={`mt-2 font-heading text-xl font-extrabold tabular-nums ${kpi.tone}`}>{brl(kpi.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
        <div className="surface p-5 lg:col-span-2">
          <h2 className="font-heading font-bold text-[15px]">Fluxo dos últimos 6 meses</h2>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">Receitas recebidas e despesas pagas</p>
          <FinanceChart data={chartData} />
        </div>
        <div className="surface p-5 bg-primary text-primary-foreground border-primary flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary-foreground/70">Saldo do período</p>
            <p className="mt-3 font-heading text-3xl font-extrabold tabular-nums">{brl(totals.balance)}</p>
            <p className="mt-1 text-xs text-primary-foreground/70">Recebimentos menos pagamentos</p>
          </div>
          <div className="mt-6 space-y-2 text-xs text-primary-foreground/80">
            <div className="flex justify-between"><span>Lançamentos</span><span className="font-semibold">{rows.length}</span></div>
            <div className="flex justify-between"><span>Pendentes</span><span className="font-semibold">{rows.filter((r) => r.status === "pending").length}</span></div>
          </div>
        </div>
      </div>

      <div className="surface mt-3 sm:mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 p-4 sm:p-5">
          <h2 className="font-heading font-bold text-[15px] mr-auto">Lançamentos</h2>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as situações</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="received">Recebidos</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
              <SelectItem value="canceled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="py-16 grid place-items-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center">
            <span className="w-12 h-12 rounded-2xl bg-muted grid place-items-center mx-auto text-muted-foreground">
              <Wallet className="w-5 h-5" />
            </span>
            <p className="mt-3 font-semibold text-sm">Nenhum lançamento no período</p>
            <p className="text-xs text-muted-foreground mt-1">Registre receitas de OS e despesas com peças.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-y border-border bg-muted/40">
                  <th className="font-semibold px-5 py-2.5">Descrição</th>
                  <th className="font-semibold px-5 py-2.5">Categoria</th>
                  <th className="font-semibold px-5 py-2.5">Vínculo</th>
                  <th className="font-semibold px-5 py-2.5">Data</th>
                  <th className="font-semibold px-5 py-2.5">Situação</th>
                  <th className="font-semibold px-5 py-2.5 text-right">Valor</th>
                  <th className="px-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-medium">{row.description || "—"}</span>
                      <span className="block text-[11px] text-muted-foreground">{row.payment_method}</span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{row.category || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.order_label || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{shortDate(row.reference_date)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                        row.status === "pending"
                          ? "bg-amber-50 text-amber-700 ring-amber-200"
                          : row.status === "canceled"
                          ? "bg-muted text-muted-foreground ring-border"
                          : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      }`}>
                        {STATUS_LABELS[row.status] || row.status}
                      </span>
                    </td>
                    <td className={`px-5 py-3 text-right font-semibold tabular-nums whitespace-nowrap ${row.type === "income" ? "text-emerald-700" : "text-rose-600"}`}>
                      {row.type === "income" ? "" : "- "}{brl(row.amount)}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {row.status === "pending" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" title="Confirmar" onClick={() => confirm(row)}>
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(row); setDialogOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove(row)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={editing}
        onSaved={load}
      />
    </div>
  );
}
