import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Clock3, Wrench, PackageCheck, TrendingUp, TrendingDown, Wallet, Plus, Sparkles } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import FinanceChart from "@/components/dashboard/FinanceChart";
import StatusBreakdown from "@/components/dashboard/StatusBreakdown";
import RecentOrders from "@/components/dashboard/RecentOrders";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useTenant } from "@/lib/TenantContext";
import { paged, ORDER_STATUSES } from "@/lib/tenant";
import { brl, monthLabel, num, periodRange } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

const PERIODS = [
  { value: "this_month", label: "Este mês" },
  { value: "last_month", label: "Mês anterior" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "year", label: "Este ano" },
];

const STATUS_COLORS = {
  "Orçamento": "bg-slate-400",
  "Aguardando aprovação": "bg-amber-500",
  "Aprovado": "bg-sky-500",
  "Aguardando equipamento": "bg-cyan-500",
  "Em execução": "bg-indigo-500",
  "Aguardando peça": "bg-purple-500",
  "Concluído": "bg-emerald-500",
  "Aguardando retirada": "bg-teal-500",
  "Entregue": "bg-green-600",
  "Cancelado": "bg-rose-500",
};

export default function Dashboard() {
  const { user, company, account } = useTenant();
  const [period, setPeriod] = useState("this_month");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [clients, setClients] = useState(0);

  useEffect(() => {
    if (!company?.id) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [orderRows, txRows, clientCount] = await Promise.all([
          paged("ServiceOrder", { company_id: company.id }, { sort: "-created_date" }),
          paged("Transaction", { company_id: company.id }, { sort: "-reference_date" }),
          base44.entities.Client.count({ company_id: company.id }),
        ]);
        if (!alive) return;
        setOrders(orderRows);
        setTransactions(txRows);
        setClients(clientCount || 0);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [company?.id]);

  const { from, to } = periodRange(period);

  const periodOrders = useMemo(
    () => orders.filter((order) => order.created_date && order.created_date >= from && order.created_date <= to),
    [orders, from, to]
  );

  const counts = useMemo(
    () => ({
      total: periodOrders.length,
      awaiting: periodOrders.filter((o) => o.status === "Aguardando aprovação").length,
      running: periodOrders.filter((o) => ["Em execução", "Aguardando peça"].includes(o.status)).length,
      delivered: periodOrders.filter((o) => o.status === "Entregue").length,
    }),
    [periodOrders]
  );

  const money = useMemo(() => {
    let revenue = 0;
    let expenses = 0;
    let pending = 0;
    for (const tx of transactions) {
      const ref = tx.reference_date || tx.paid_date || tx.created_date;
      const amount = Number(tx.amount) || 0;
      if (tx.type === "income" && tx.status === "received" && ref >= from && ref <= to) revenue += amount;
      if (tx.type === "expense" && tx.status === "paid" && ref >= from && ref <= to) expenses += amount;
      if (tx.type === "income" && tx.status === "pending" && ref >= from && ref <= to) pending += amount;
    }
    return { revenue, expenses, balance: revenue - expenses, pending };
  }, [transactions, from, to]);

  const chartData = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: monthLabel(date),
        receita: 0,
        despesa: 0,
      });
    }
    for (const tx of transactions) {
      const raw = tx.reference_date || tx.paid_date || tx.created_date;
      if (!raw) continue;
      const date = new Date(raw);
      const bucket = buckets.find((b) => b.key === `${date.getFullYear()}-${date.getMonth()}`);
      if (!bucket) continue;
      const amount = Number(tx.amount) || 0;
      if (tx.type === "income" && tx.status === "received") bucket.receita += amount;
      if (tx.type === "expense" && tx.status === "paid") bucket.despesa += amount;
    }
    return buckets;
  }, [transactions]);

  const statusRows = useMemo(() => {
    const map = {};
    for (const order of orders) map[order.status] = (map[order.status] || 0) + 1;
    return ORDER_STATUSES.map((label) => ({
      label,
      color: STATUS_COLORS[label] || "bg-muted-foreground",
      value: map[label] || 0,
    }));
  }, [orders]);

  const recent = orders.slice(0, 5);
  const firstName = (user?.full_name || "").split(" ")[0] || "bem-vindo";
  const trialDays = account?.status === "trial" && account?.trial_ends_at
    ? Math.ceil((new Date(account.trial_ends_at) - new Date()) / 86400000)
    : null;

  return (
    <div>
      <section className="hero-panel relative mb-5 overflow-hidden rounded-[26px] px-6 py-7 text-white sm:px-8 sm:py-8">
        <div className="auth-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[hsl(152_70%_48%_/_0.18)] blur-[90px]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
              {company?.trade_name || company?.name || "Sua empresa"}
            </p>
            <h1 className="mt-2 font-heading text-[27px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[33px]">
              Olá, {firstName}
            </h1>
            <p className="mt-2 max-w-md text-[12.5px] leading-relaxed text-white/55">
              Visão geral da operação — ordens em andamento, faturamento e status da bancada.
            </p>

            {trialDays !== null && trialDays >= 0 && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1.5 text-[11px] text-white/75 ring-1 ring-white/[0.14] backdrop-blur">
                <Sparkles className="h-3 w-3 text-[hsl(152_72%_64%)]" />
                Teste · {trialDays} dia(s) restantes
                <Link to="/configuracoes?tab=plano" className="font-semibold text-white underline-offset-2 hover:underline">
                  Ver planos
                </Link>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-10 w-[168px] rounded-xl border-white/15 bg-white/[0.08] text-[12.5px] font-medium text-white backdrop-blur hover:bg-white/[0.12] focus:ring-white/25">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {PERIODS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              asChild
              className="h-10 gap-2 rounded-xl bg-white px-4 text-[12.5px] font-semibold text-primary shadow-[0_14px_30px_-18px_rgba(0,0,0,0.9)] hover:bg-white/95"
            >
              <Link to="/ordens/nova"><Plus className="h-4 w-4" /> Nova OS</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4"><div><h2 className="font-heading text-[14px] font-bold">Operação</h2><p className="mt-0.5 text-[11px] text-muted-foreground">Acompanhamento das ordens de serviço</p></div></div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Ordens no período" value={loading ? "—" : num(counts.total)} hint="Documentos emitidos" icon={FileText} delay={0} />
        <StatCard label="Aguardando aprovação" value={loading ? "—" : num(counts.awaiting)} hint="Orçamentos com o cliente" icon={Clock3} tone="warning" delay={60} />
        <StatCard label="Em execução" value={loading ? "—" : num(counts.running)} hint="Na bancada agora" icon={Wrench} tone="info" delay={120} />
        <StatCard label="Entregues" value={loading ? "—" : num(counts.delivered)} hint="Finalizadas no período" icon={PackageCheck} tone="success" delay={180} />
      </div>

      <div className="mb-3 mt-5 sm:mb-4 sm:mt-6"><h2 className="font-heading text-[14px] font-bold">Financeiro</h2><p className="mt-0.5 text-[11px] text-muted-foreground">Entradas, despesas e saldo conforme o período selecionado</p></div>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
        <div className="surface-hover rounded-2xl border border-border/70 bg-card p-5" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted-foreground">Faturamento recebido</p>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/[0.1] text-emerald-600 ring-1 ring-emerald-500/15">
              <TrendingUp className="h-[17px] w-[17px]" />
            </span>
          </div>
          <p className="mt-4 font-heading text-[25px] font-extrabold leading-none tracking-[-0.03em] tabular-nums text-emerald-700">
            {brl(money.revenue)}
          </p>
          <p className="mt-2 text-[11.5px] text-muted-foreground">Pagamentos confirmados no período</p>
        </div>

        <div className="surface-hover rounded-2xl border border-border/70 bg-card p-5" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted-foreground">Despesas</p>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/[0.1] text-rose-600 ring-1 ring-rose-500/15">
              <TrendingDown className="h-[17px] w-[17px]" />
            </span>
          </div>
          <p className="mt-4 font-heading text-[25px] font-extrabold leading-none tracking-[-0.03em] tabular-nums text-rose-600">
            {brl(money.expenses)}
          </p>
          <p className="mt-2 text-[11.5px] text-muted-foreground">Custos e peças pagos no período</p>
        </div>

        <div className="hero-panel relative overflow-hidden rounded-2xl p-5 text-white">
          <div className="auth-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-white/50">Saldo do período</p>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.1] text-white/80 ring-1 ring-white/15">
              <Wallet className="h-[17px] w-[17px]" />
            </span>
          </div>
          <p className="relative mt-4 font-heading text-[25px] font-extrabold leading-none tracking-[-0.03em] tabular-nums">
            {brl(money.balance)}
          </p>
          <p className="relative mt-2 text-[11.5px] text-white/50">
            {money.pending > 0 ? `${brl(money.pending)} a receber no período` : "Entradas menos saídas"}
          </p>
        </div>
      </div>

      <div className="mb-3 mt-5 sm:mb-4 sm:mt-6"><h2 className="font-heading text-[14px] font-bold">Acompanhamento</h2><p className="mt-0.5 text-[11px] text-muted-foreground">Evolução financeira e situação atual das ordens</p></div>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        <div className="surface p-5 lg:col-span-2">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-[15px] font-bold tracking-[-0.01em]">Faturamento mensal</h2>
              <p className="mt-1 text-[11.5px] text-muted-foreground">Receitas recebidas e despesas pagas nos últimos 6 meses</p>
            </div>
            <div className="hidden items-center gap-3 text-[10.5px] font-medium text-muted-foreground sm:flex">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> Receita
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-chart-4" /> Despesa
              </span>
            </div>
          </div>
          {loading ? <Skeleton className="h-[240px] w-full rounded-xl" /> : <FinanceChart data={chartData} />}
        </div>
        <StatusBreakdown rows={statusRows} clients={clients} />
      </div>

      <RecentOrders orders={recent} />
    </div>
  );
}
