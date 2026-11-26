import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2, Loader2, ShieldCheck, Users, Wallet, Plus, Pencil, LogOut, ArrowLeft, Inbox, Trash2, Search, RefreshCw, CreditCard, Clock3,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BrandMark from "@/components/BrandMark";
import CompanyAccountDialog from "@/components/platform/CompanyAccountDialog";
import PlanDialog from "@/components/platform/PlanDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { base44 } from "@/api/base44Client";
import { useTenant } from "@/lib/TenantContext";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { activatePlanRequest, paged } from "@/lib/tenant";
import { brl, dateTime, shortDate } from "@/lib/format";
import { SUBSCRIPTION_STATUS_LABELS } from "@/lib/subscriptions";

const STATUS_STYLES = {
  trial: "bg-sky-50 text-sky-700 ring-sky-200",
  awaiting_payment: "bg-amber-50 text-amber-700 ring-amber-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  past_due: "bg-orange-50 text-orange-700 ring-orange-200",
  suspended: "bg-rose-50 text-rose-700 ring-rose-200",
  canceled: "bg-muted text-muted-foreground ring-border",
};

const STATUS_LABELS = {
  trial: "Teste",
  awaiting_payment: "Aguardando",
  active: "Ativo",
  past_due: "Pagamento atrasado",
  suspended: "Suspenso",
  canceled: "Cancelado",
};

function StatusPill({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STATUS_STYLES[status] || STATUS_STYLES.canceled}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default function Plataforma() {
  const { company, isPlatformAdmin } = useTenant();
  const { logout } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [plans, setPlans] = useState([]);
  const [audit, setAudit] = useState([]);
  const [subscriptionEvents, setSubscriptionEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [requestActionError, setRequestActionError] = useState("");
  const [accountDialog, setAccountDialog] = useState({ open: false, company: null, account: null });
  const [planDialog, setPlanDialog] = useState({ open: false, plan: null });
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingCompany, setDeletingCompany] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteNotice, setDeleteNotice] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [companyStatusFilter, setCompanyStatusFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setLoadError("");
    const tasks = [
      ["Empresas (companies)", () => paged("Company", {}, { limit: 300 })],
      ["Assinaturas (companyAccounts)", () => paged("CompanyAccount", {}, { limit: 300 })],
      ["Membros (memberships)", () => paged("Membership", {}, { limit: 400 })],
      ["Solicitações (planRequests)", () => paged("PlanRequest", {}, { sort: "-created_date", limit: 100 })],
      ["Planos (plans)", () => paged("Plan", {}, { sort: "sort_order", limit: 50 })],
      ["Auditoria (auditLogs)", () => paged("AuditLog", {}, { sort: "-at", limit: 40 })],
      ["Histórico de assinaturas", () => paged("SubscriptionEvent", {}, { sort: "-occurred_at", limit: 30 })],
    ];
    const results = await Promise.allSettled(tasks.map(([, run]) => run()));
    const setters = [setCompanies, setAccounts, setMembers, setRequests, setPlans, setAudit, setSubscriptionEvents];
    const failures = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const rows = result.value;
        if (index === 0) {
          rows.sort((a, b) => {
            const dateValue = (item) => item?.created_date || item?.created_at || item?.createdAt || 0;
            const toTime = (value) => {
              const normalized = value?.toDate ? value.toDate() : value;
              const time = new Date(normalized).getTime();
              return Number.isFinite(time) ? time : 0;
            };
            return toTime(dateValue(b)) - toTime(dateValue(a));
          });
        }
        setters[index](rows);
      }
      else failures.push(`${tasks[index][0]}: ${result.reason?.message || "permissão negada"}`);
    });
    if (failures.length) {
      console.error("Falha ao carregar dados do painel da plataforma:", failures);
      setLoadError(failures.join(" | "));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isPlatformAdmin) load();
  }, [isPlatformAdmin]);

  const accountByCompany = useMemo(() => {
    const map = {};
    for (const account of accounts) map[account.company_id] = account;
    return map;
  }, [accounts]);

  const subscriptionRows = useMemo(() => {
    return accounts.map((account) => {
      const companyItem = companies.find((item) => item.id === account.company_id);
      return { ...account, display_company: companyItem?.name || account.company_name || "Empresa não identificada" };
    }).sort((a, b) => String(a.display_company).localeCompare(String(b.display_company), "pt-BR"));
  }, [accounts, companies]);

  const memberCount = useMemo(() => {
    const map = {};
    for (const member of members) map[member.company_id] = (map[member.company_id] || 0) + 1;
    return map;
  }, [members]);

  const metrics = useMemo(() => {
    const active = accounts.filter((item) => item.status === "active");
    return {
      companies: companies.length,
      active: active.length,
      trial: accounts.filter((item) => item.status === "trial").length,
      suspended: accounts.filter((item) => item.status === "suspended").length,
      mrr: active.reduce((sum, item) => sum + (Number(item.price) || 0), 0),
      pending: requests.filter((item) => item.status === "pending").length,
    };
  }, [companies, accounts, requests]);

  const filteredCompanies = useMemo(() => {
    const term = companySearch.trim().toLocaleLowerCase("pt-BR");
    return companies.filter((item) => {
      const account = accounts.find((entry) => entry.company_id === item.id);
      const matchesSearch = !term || [item.name, item.owner_email, item.email, account?.plan_name]
        .some((value) => String(value || "").toLocaleLowerCase("pt-BR").includes(term));
      const matchesStatus = companyStatusFilter === "all" || (account?.status || "unknown") === companyStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [companies, accounts, companySearch, companyStatusFilter]);

  const deleteCompany = async () => {
    if (!deleteDialog || deleteConfirmation.trim() !== deleteDialog.name?.trim()) return;
    setDeletingCompany(true);
    setDeleteError("");
    setDeleteNotice("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sua sessão expirou. Entre novamente.");
      const response = await fetch("/api/admin/delete-company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId: deleteDialog.id,
          confirmationName: deleteConfirmation.trim(),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Não foi possível excluir a empresa.");

      setCompanies((current) => current.filter((item) => item.id !== deleteDialog.id));
      setAccounts((current) => current.filter((item) => item.company_id !== deleteDialog.id));
      setMembers((current) => current.filter((item) => item.company_id !== deleteDialog.id));
      setDeleteDialog(null);
      setDeleteConfirmation("");
      setDeleteNotice(
        result.authDeletionFailures?.length
          ? `A empresa foi removida do Firestore, mas ${result.authDeletionFailures.length} conta(s) do Firebase Authentication precisam de verificação.`
          : `A empresa "${result.companyName}" e seus dados vinculados foram excluídos.`
      );
      await load();
    } catch (error) {
      setDeleteError(error?.message || "Falha ao excluir a empresa.");
    } finally {
      setDeletingCompany(false);
    }
  };

  const setRequestStatus = async (request, status) => {
    setRequestActionError("");
    try {
      if (status === "done") {
        await activatePlanRequest(request);
      } else {
        await base44.entities.PlanRequest.update(request.id, { status });
      }
      await load();
    } catch (error) {
      setRequestActionError(error?.message || "Não foi possível atualizar a solicitação.");
    }
  };

  if (!isPlatformAdmin) return null;

  const kpis = [
    { label: "Empresas", value: metrics.companies, icon: Building2, tone: "text-foreground" },
    { label: "Assinaturas ativas", value: metrics.active, icon: ShieldCheck, tone: "text-emerald-700" },
    { label: "Em teste", value: metrics.trial, icon: Users, tone: "text-sky-700" },
    { label: "Suspensas", value: metrics.suspended, icon: Building2, tone: "text-rose-600" },
    { label: "Receita recorrente", value: brl(metrics.mrr), icon: Wallet, tone: "text-primary" },
    { label: "Solicitações", value: metrics.pending, icon: Inbox, tone: "text-amber-600" },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <header className="no-print sticky top-0 z-30 border-b border-[#e1eae4] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <BrandMark className="h-10 w-10 shrink-0 text-primary" />
          <span className="leading-tight">
            <span className="block font-heading font-extrabold text-[15px]">OS PRO</span>
            <span className="block text-[11px] text-muted-foreground">Painel da plataforma</span>
          </span>
          <div className="ml-auto flex items-center gap-1">
            {company && (
              <Button asChild variant="ghost" size="sm" className="gap-1.5">
                <Link to="/"><ArrowLeft className="w-4 h-4" /> Meu sistema</Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => logout(true)}>
              <LogOut className="w-4 h-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="mb-7 flex flex-col gap-4 border-b border-[#dfe9e2] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#238f78]">
              <span className="h-2 w-2 rounded-full bg-[#238f78]" /> Administração geral
            </div>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-[#152b20] sm:text-3xl">Painel da plataforma</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[#6b7c71]">Visão central das empresas, assinaturas, planos e movimentações do OS PRO.</p>
          </div>
          <Button className="h-10 gap-2 bg-[#18785f] text-white shadow-sm hover:bg-[#12634e]" onClick={() => setPlanDialog({ open: true, plan: null })}>
            <Plus className="h-4 w-4" /> Novo plano
          </Button>
        </div>

        {deleteNotice && (
          <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{deleteNotice}</div>
        )}
        {loadError && (
          <div role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Não foi possível carregar todos os dados: {loadError}
          </div>
        )}

        {loading ? (
          <div className="py-24 grid place-items-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <>
            <section className="mb-5 rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/[0.06] p-5 sm:p-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Central de administração</p>
                  <h2 className="mt-1 font-heading text-xl font-extrabold tracking-tight">Visão geral da plataforma</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Acompanhe empresas, assinaturas e atividade comercial em um só lugar.</p>
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-fit gap-2 sm:mt-0" onClick={load} disabled={loading}>
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Atualizar dados
                </Button>
              </div>
            </section>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {kpis.map((kpi, index) => (
                <div key={kpi.label} className="group relative overflow-hidden rounded-2xl border border-[#e0e9e3] bg-white p-4 shadow-[0_5px_22px_-18px_rgba(20,70,48,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="max-w-[110px] text-[10px] font-bold uppercase leading-relaxed tracking-[0.08em] text-muted-foreground">{kpi.label}</p>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#eff6f1]">
                      <kpi.icon className="h-4 w-4 text-[#238f78]" />
                    </span>
                  </div>
                  <p className={`mt-3 font-heading text-xl font-extrabold tabular-nums tracking-tight ${kpi.tone}`}>{kpi.value}</p>
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-[#238f78]/50 to-transparent" />
                </div>
              ))}
            </div>

            <section className="mt-6 overflow-hidden rounded-2xl border border-[#e0e9e3] bg-white shadow-[0_8px_30px_-24px_rgba(20,70,48,0.35)]">
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Building2 className="h-4 w-4" /></span>
                    <div>
                      <h2 className="font-heading font-bold text-[15px]">Empresas cadastradas</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">Dados cadastrais e de cobrança; informações operacionais permanecem privadas.</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:w-[420px] sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={companySearch} onChange={(event) => setCompanySearch(event.target.value)} placeholder="Buscar empresa ou plano..." className="h-9 pl-9" />
                  </div>
                  <select
                    aria-label="Filtrar empresas por situação"
                    value={companyStatusFilter}
                    onChange={(event) => setCompanyStatusFilter(event.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="all">Todas as situações</option>
                    <option value="active">Ativas</option>
                    <option value="trial">Em teste</option>
                    <option value="suspended">Suspensas</option>
                    <option value="awaiting_payment">Aguardando</option>
                    <option value="canceled">Canceladas</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between border-y border-border bg-muted/20 px-5 py-2">
                <span className="text-xs text-muted-foreground">{filteredCompanies.length} de {companies.length} empresa(s)</span>
                {(companySearch || companyStatusFilter !== "all") && (
                  <button type="button" onClick={() => { setCompanySearch(""); setCompanyStatusFilter("all"); }} className="text-xs font-semibold text-primary hover:underline">Limpar filtros</button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[760px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-y border-border bg-muted/40">
                      <th className="font-semibold px-5 py-2.5">Empresa</th>
                      <th className="font-semibold px-5 py-2.5">Plano</th>
                      <th className="font-semibold px-5 py-2.5">Situação</th>
                      <th className="font-semibold px-5 py-2.5">Usuários</th>
                      <th className="font-semibold px-5 py-2.5">Criada em</th>
                      <th className="px-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.map((item) => {
                      const account = accountByCompany[item.id];
                      return (
                        <tr key={item.id} className="border-b border-border/60 transition-colors hover:bg-muted/25 last:border-0">
                          <td className="px-5 py-3">
                            <span className="font-medium">{item.name}</span>
                            <span className="block text-[11px] text-muted-foreground">{item.owner_email || item.email}</span>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">
                            {account?.plan_name || "—"}
                            <span className="block text-[11px]">{brl(account?.price || 0)}</span>
                          </td>
                          <td className="px-5 py-3"><StatusPill status={account?.status} /></td>
                          <td className="px-5 py-3 text-muted-foreground tabular-nums">{memberCount[item.id] || 0}</td>
                          <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{shortDate(item.created_date || item.created_at || item.createdAt)}</td>
                          <td className="px-2 py-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => setAccountDialog({ open: true, company: item, account })}
                              >
                                <Pencil className="w-3.5 h-3.5" /> Gerenciar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setDeleteConfirmation("");
                                  setDeleteError("");
                                  setDeleteDialog({ id: item.id, name: item.name });
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Excluir
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredCompanies.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center">
                          <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-muted"><Building2 className="h-5 w-5 text-muted-foreground" /></span>
                          <p className="text-sm font-semibold">{companies.length === 0 ? "Nenhuma empresa encontrada" : "Nenhum resultado para esses filtros"}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{companies.length === 0 ? "As empresas aparecerão aqui quando forem carregadas." : "Tente outro nome ou altere o filtro de situação."}</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-6 overflow-hidden rounded-2xl border border-[#e0e9e3] bg-white shadow-[0_8px_30px_-24px_rgba(20,70,48,0.35)]">
              <div className="flex flex-col gap-2 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><CreditCard className="h-4 w-4" /></span>
                  <div>
                    <h2 className="font-heading font-bold text-[15px]">Acompanhamento de assinaturas</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">Situação atual, plano e período de cada empresa.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">{metrics.active} ativas</span>
                  <span className="rounded-full bg-orange-50 px-2.5 py-1 font-semibold text-orange-700">{accounts.filter((item) => item.status === "past_due").length} atrasadas</span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">{metrics.pending} solicitações pendentes</span>
                </div>
              </div>
              {subscriptionRows.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground">Nenhuma assinatura cadastrada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th className="px-5 py-3 font-semibold">Empresa</th>
                        <th className="px-5 py-3 font-semibold">Plano</th>
                        <th className="px-5 py-3 font-semibold">Valor mensal</th>
                        <th className="px-5 py-3 font-semibold">Situação</th>
                        <th className="px-5 py-3 font-semibold">Período até</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptionRows.map((account) => (
                        <tr key={account.id || account.company_id} className="border-b border-border/60 last:border-0">
                          <td className="px-5 py-3 font-medium">{account.display_company}</td>
                          <td className="px-5 py-3 text-muted-foreground">{account.plan_name || "—"}</td>
                          <td className="px-5 py-3 tabular-nums">{brl(account.price || 0)}</td>
                          <td className="px-5 py-3"><StatusPill status={account.status} /></td>
                          <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">{shortDate(account.current_period_end || account.trial_ends_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="border-t border-border bg-muted/20 px-5 py-3 text-[11px] leading-relaxed text-muted-foreground">
                Dados de acompanhamento do cadastro atual. Ainda não representam confirmação automática de pagamento nem histórico financeiro do provedor.
              </p>
            </section>

            <section className="mt-6 overflow-hidden rounded-2xl border border-[#e0e9e3] bg-white p-5 shadow-[0_8px_30px_-24px_rgba(20,70,48,0.35)]">
              <div className="mb-4 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-sky-500/10 text-sky-700"><Clock3 className="h-4 w-4" /></span>
                <div>
                  <h2 className="font-heading font-bold text-[15px]">Histórico de assinaturas</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">Eventos registrados durante as ações administrativas.</p>
                </div>
              </div>
              {subscriptionEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum evento de assinatura registrado ainda. As próximas ativações administrativas aparecerão aqui.</p>
              ) : (
                <ul className="divide-y divide-border/70">
                  {subscriptionEvents.map((event) => (
                    <li key={event.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{event.company_name || "Empresa"}</p>
                        <p className="text-xs text-muted-foreground">{event.description || "Evento de assinatura"}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {event.metadata?.plan_name || "Plano não informado"} · {event.metadata?.amount != null ? brl(event.metadata.amount) : "Valor não informado"}
                        </p>
                        {(event.metadata?.previous_status || event.metadata?.previous_amount != null) && (
                          <p className="text-[11px] text-muted-foreground">
                            Antes: {event.metadata?.previous_status && event.metadata.previous_status !== "not_created" ? (SUBSCRIPTION_STATUS_LABELS[event.metadata.previous_status] || event.metadata.previous_status) : "Sem assinatura"}
                            {event.metadata?.previous_amount != null ? ` · ${brl(event.metadata.previous_amount)}` : ""}
                            {event.metadata?.previous_plan_name ? ` · ${event.metadata.previous_plan_name}` : ""}
                          </p>
                        )}
                        {event.metadata?.payment_confirmed_by_provider === false && (
                          <p className="text-[11px] text-amber-700">Registro administrativo; não representa confirmação automática de pagamento.</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{SUBSCRIPTION_STATUS_LABELS[event.status] || event.status}</span>
                        <span className="text-[11px] text-muted-foreground">{dateTime(event.occurred_at)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <section className="overflow-hidden rounded-2xl border border-[#e0e9e3] bg-white p-5 shadow-[0_8px_30px_-24px_rgba(20,70,48,0.35)]">
                <div className="mb-4 flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/10 text-amber-600"><Inbox className="h-4 w-4" /></span>
                  <div>
                    <h2 className="font-heading font-bold text-[15px]">Solicitações de plano</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">Acompanhe os pedidos comerciais e suas ativações.</p>
                  </div>
                </div>
                {requestActionError && (
                  <p role="alert" className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    {requestActionError}
                  </p>
                )}
                {requests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma solicitação registrada.</p>
                ) : (
                  <ul className="space-y-3">
                    {requests.map((request) => (
                      <li key={request.id} className="rounded-xl border border-border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{request.company_name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {request.plan_name} · {brl(request.price)} · {request.contact}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{dateTime(request.created_date)}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            request.status === "pending" ? "bg-amber-50 text-amber-700" : request.status === "done" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                          }`}>
                            {request.status === "pending" ? "pendente" : request.status === "contacted" ? "contatado" : request.status === "done" ? "concluído" : "cancelado"}
                          </span>
                        </div>
                        {(request.status !== "done" || accountByCompany[request.company_id]?.status !== "active" || accountByCompany[request.company_id]?.plan_id !== request.plan_id) && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {request.status !== "done" && (
                              <Button size="sm" variant="outline" onClick={() => setRequestStatus(request, "contacted")}>Marcar contato</Button>
                            )}
                            <Button size="sm" onClick={() => setRequestStatus(request, "done")}>
                              {request.status === "done" ? "Ativar plano" : "Confirmar pagamento e ativar"}
                            </Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="surface overflow-hidden p-5">
                <div className="mb-4 flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><CreditCard className="h-4 w-4" /></span>
                  <div>
                    <h2 className="font-heading font-bold text-[15px]">Planos</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">Preços e limites disponíveis para contratação.</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {plans.map((plan) => (
                    <li key={plan.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {plan.name}
                          {!plan.active && <span className="ml-2 text-[10px] uppercase text-muted-foreground">inativo</span>}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {brl(plan.price_monthly)} · {plan.max_users} usuários · {plan.max_orders_month} OS/mês
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPlanDialog({ open: true, plan })}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="mt-6 overflow-hidden rounded-2xl border border-[#e0e9e3] bg-white p-5 shadow-[0_8px_30px_-24px_rgba(20,70,48,0.35)]">
              <div className="mb-4 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground"><Clock3 className="h-4 w-4" /></span>
                <div>
                  <h2 className="font-heading font-bold text-[15px]">Auditoria recente</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">Histórico das ações administrativas da plataforma.</p>
                </div>
              </div>
              {audit.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum registro ainda.</p>
              ) : (
                <ul className="divide-y divide-border/70">
                  {audit.slice(0, 12).map((entry) => (
                    <li key={entry.id} className="py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className="font-semibold">{entry.action}</span>
                      <span className="text-muted-foreground">{entry.company_name || "—"}</span>
                      <span className="text-muted-foreground">{entry.target}</span>
                      <span className="text-muted-foreground ml-auto">{dateTime(entry.at || entry.created_date)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      <CompanyAccountDialog
        open={accountDialog.open}
        onOpenChange={(open) => setAccountDialog((prev) => ({ ...prev, open }))}
        company={accountDialog.company}
        account={accountDialog.account}
        plans={plans}
        onSaved={load}
      />
      <AlertDialog
        open={Boolean(deleteDialog)}
        onOpenChange={(open) => {
          if (!open && !deletingCompany) {
            setDeleteDialog(null);
            setDeleteConfirmation("");
            setDeleteError("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Excluir empresa definitivamente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. Serão removidos os dados da empresa no Firestore, incluindo clientes, equipamentos, ordens de serviço, financeiro, assinatura, convites e vínculos. As contas de acesso exclusivas dessa empresa também serão excluídas do Firebase Authentication. Usuários compartilhados com outra empresa serão preservados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Digite exatamente o nome: {deleteDialog?.name}</p>
            <Input
              autoComplete="off"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              placeholder="Nome da empresa"
              disabled={deletingCompany}
            />
            {deleteError && <p role="alert" className="text-sm text-destructive">{deleteError}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingCompany}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={deleteCompany}
              disabled={deletingCompany || deleteConfirmation.trim() !== deleteDialog?.name?.trim()}
              className="gap-2"
            >
              {deletingCompany && <Loader2 className="h-4 w-4 animate-spin" />}
              {deletingCompany ? "Excluindo..." : "Excluir definitivamente"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <PlanDialog
        open={planDialog.open}
        onOpenChange={(open) => setPlanDialog((prev) => ({ ...prev, open }))}
        plan={planDialog.plan}
        onSaved={load}
      />
    </div>
  );
}
