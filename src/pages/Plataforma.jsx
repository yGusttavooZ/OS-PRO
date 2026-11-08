import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2, Loader2, ShieldCheck, Users, Wallet, Plus, Pencil, LogOut, ArrowLeft, Inbox,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import CompanyAccountDialog from "@/components/platform/CompanyAccountDialog";
import PlanDialog from "@/components/platform/PlanDialog";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useTenant } from "@/lib/TenantContext";
import { useAuth } from "@/lib/AuthContext";
import { paged } from "@/lib/tenant";
import { brl, dateTime, shortDate } from "@/lib/format";

const STATUS_STYLES = {
  trial: "bg-sky-50 text-sky-700 ring-sky-200",
  awaiting_payment: "bg-amber-50 text-amber-700 ring-amber-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  suspended: "bg-rose-50 text-rose-700 ring-rose-200",
  canceled: "bg-muted text-muted-foreground ring-border",
};

const STATUS_LABELS = {
  trial: "Teste",
  awaiting_payment: "Aguardando",
  active: "Ativo",
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
  const [loading, setLoading] = useState(true);
  const [accountDialog, setAccountDialog] = useState({ open: false, company: null, account: null });
  const [planDialog, setPlanDialog] = useState({ open: false, plan: null });

  const load = async () => {
    setLoading(true);
    const [companyRows, accountRows, memberRows, requestRows, planRows, auditRows] = await Promise.all([
      paged("Company", {}, { sort: "-created_date", limit: 300 }),
      paged("CompanyAccount", {}, { limit: 300 }),
      paged("Membership", {}, { limit: 400 }),
      paged("PlanRequest", {}, { sort: "-created_date", limit: 100 }),
      paged("Plan", {}, { sort: "sort_order", limit: 50 }),
      paged("AuditLog", {}, { sort: "-at", limit: 40 }),
    ]);
    setCompanies(companyRows);
    setAccounts(accountRows);
    setMembers(memberRows);
    setRequests(requestRows);
    setPlans(planRows);
    setAudit(auditRows);
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

  const setRequestStatus = async (request, status) => {
    await base44.entities.PlanRequest.update(request.id, { status });
    load();
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
    <div className="min-h-screen bg-background">
      <header className="no-print sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-heading font-extrabold text-sm">
            OS
          </span>
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

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <PageHeader
          title="Gestão da plataforma"
          subtitle="Empresas assinantes, planos e solicitações comerciais do OS PRO."
          actions={
            <Button variant="outline" className="h-10 gap-2" onClick={() => setPlanDialog({ open: true, plan: null })}>
              <Plus className="w-4 h-4" /> Novo plano
            </Button>
          }
        />

        {loading ? (
          <div className="py-24 grid place-items-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="surface p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{kpi.label}</p>
                    <kpi.icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <p className={`mt-2 font-heading text-lg font-extrabold tabular-nums ${kpi.tone}`}>{kpi.value}</p>
                </div>
              ))}
            </div>

            <section className="surface mt-4 overflow-hidden">
              <div className="p-5 pb-3">
                <h2 className="font-heading font-bold text-[15px]">Empresas cadastradas</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Dados cadastrais e de cobrança. Clientes, ordens e valores são privados de cada empresa.
                </p>
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
                    {companies.map((item) => {
                      const account = accountByCompany[item.id];
                      return (
                        <tr key={item.id} className="border-b border-border/60 last:border-0">
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
                          <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{shortDate(item.created_date)}</td>
                          <td className="px-2 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => setAccountDialog({ open: true, company: item, account })}
                            >
                              <Pencil className="w-3.5 h-3.5" /> Gerenciar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid lg:grid-cols-2 gap-4 mt-4">
              <section className="surface p-5">
                <h2 className="font-heading font-bold text-[15px]">Solicitações de plano</h2>
                <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                  Pedidos feitos pelas empresas. A ativação acontece após a confirmação do pagamento.
                </p>
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
                        {request.status !== "done" && (
                          <div className="mt-2 flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setRequestStatus(request, "contacted")}>Marcar contato</Button>
                            <Button size="sm" onClick={() => setRequestStatus(request, "done")}>Concluir</Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="surface p-5">
                <h2 className="font-heading font-bold text-[15px]">Planos</h2>
                <p className="text-xs text-muted-foreground mt-0.5 mb-4">Valores e limites exibidos na contratação.</p>
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

            <section className="surface p-5 mt-4">
              <h2 className="font-heading font-bold text-[15px]">Auditoria recente</h2>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                Ações administrativas registradas pelas empresas e pela plataforma.
              </p>
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
      <PlanDialog
        open={planDialog.open}
        onOpenChange={(open) => setPlanDialog((prev) => ({ ...prev, open }))}
        plan={planDialog.plan}
        onSaved={load}
      />
    </div>
  );
}
