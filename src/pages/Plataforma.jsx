import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2, Loader2, ShieldCheck, Users, Wallet, Plus, Pencil, LogOut, ArrowLeft, Inbox, Trash2,
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
  const [loadError, setLoadError] = useState("");
  const [requestActionError, setRequestActionError] = useState("");
  const [accountDialog, setAccountDialog] = useState({ open: false, company: null, account: null });
  const [planDialog, setPlanDialog] = useState({ open: false, plan: null });
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingCompany, setDeletingCompany] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteNotice, setDeleteNotice] = useState("");

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
    ];
    const results = await Promise.allSettled(tasks.map(([, run]) => run()));
    const setters = [setCompanies, setAccounts, setMembers, setRequests, setPlans, setAudit];
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
    <div className="min-h-screen bg-background">
      <header className="no-print sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-primary text-primary-foreground grid place-items-center">
            <BrandMark className="h-6 w-6 text-primary-foreground" />
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
