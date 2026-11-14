import { useEffect, useState } from "react";
import { Loader2, Check, Sparkles, CreditCard, CalendarDays, ShieldCheck, Crown, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useTenant } from "@/lib/TenantContext";
import { invalidateTenantCache, paged } from "@/lib/tenant";
import { brl, shortDate } from "@/lib/format";

const STATUS_LABELS = {
  trial: "Período de teste",
  awaiting_payment: "Aguardando pagamento",
  active: "Ativo",
  past_due: "Pagamento atrasado",
  canceled: "Cancelado",
};

export default function PlanSettings() {
  const { company, account, user } = useTenant();
  const [plans, setPlans] = useState([]);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState("");

  const load = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const [planRows, requestRows] = await Promise.all([
        paged("Plan", { active: true }, { sort: "sort_order", limit: 20 }),
        paged("PlanRequest", { company_id: company.id }, { sort: "-created_date", limit: 10 }),
      ]);
      setPlans(planRows);
      setRequest(requestRows.find((row) => row.status === "pending") || null);
    } catch (err) {
      setMessage(err?.message || "Não foi possível carregar os planos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [company?.id]);

  const requestPlan = async (plan) => {
    setSending(plan.id);
    setMessage("");
    try {
      await base44.entities.PlanRequest.create({
        company_id: company.id,
        company_name: company.name,
        plan_id: plan.id,
        plan_name: plan.name,
        price: Number(plan.price_monthly) || 0,
        status: "pending",
        contact: user?.email || "",
      });
      setMessage(
        `Solicitação do plano ${plan.name} registrada. Nossa equipe entra em contato para concluir a assinatura.`
      );
      invalidateTenantCache("PlanRequest");
      await load();
    } catch (err) {
      setMessage(err?.message || "Não foi possível registrar a solicitação. Tente novamente.");
    } finally {
      setSending("");
    }
  };

  if (loading) {
    return (
      <div className="py-16 grid place-items-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-heading text-[15px] font-bold">Sua assinatura</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Resumo do plano vinculado à sua empresa.</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-foreground">
            <span className={`h-2 w-2 rounded-full ${account?.status === "active" ? "bg-emerald-500" : account?.status === "past_due" ? "bg-amber-500" : "bg-muted-foreground"}`} />
            {STATUS_LABELS[account?.status] || "Situação não informada"}
          </span>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Plano contratado</p>
            <p className="mt-2 text-base font-bold">{account?.plan_name || "Período de teste"}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Valor mensal</p>
            <p className="mt-2 text-base font-bold">{brl(account?.price || 0)}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> Válido até
            </p>
            <p className="mt-2 text-base font-bold">{shortDate(account?.current_period_end || account?.trial_ends_at)}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> Conta
            </p>
            <p className="mt-2 text-base font-bold">{company?.name || "Sua empresa"}</p>
          </div>
        </div>

        {request && (
          <div className="mx-5 mb-5 flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold">Solicitação em análise</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Seu pedido para o plano <strong className="text-foreground">{request.plan_name}</strong> foi registrado em {shortDate(request.created_date)}. Nossa equipe entrará em contato para concluir a assinatura.
              </p>
            </div>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-heading text-[15px] font-bold">Planos disponíveis</h2>
          <p className="mt-1 text-xs text-muted-foreground">Escolha a opção que melhor acompanha sua assistência técnica.</p>
        </div>
        <span className="text-xs text-muted-foreground">{plans.length} {plans.length === 1 ? "plano disponível" : "planos disponíveis"}</span>
      </div>

      {plans.length === 0 ? (
        <div className="surface px-5 py-10 text-center">
          <CreditCard className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">Nenhum plano disponível no momento</p>
          <p className="mt-1 text-xs text-muted-foreground">Os planos serão exibidos aqui quando estiverem ativos.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = account?.plan_id === plan.id;
            return (
              <article
                key={plan.id}
                className={`relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-colors ${plan.highlight ? "border-primary/60 shadow-sm" : "border-border"}`}
              >
                {plan.highlight && (
                  <div className="flex items-center gap-1.5 bg-primary px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                    <Crown className="h-3.5 w-3.5" /> Recomendado
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-heading text-lg font-extrabold">{plan.name}</h3>
                      <p className="mt-1 min-h-8 text-xs leading-relaxed text-muted-foreground">{plan.description || "Recursos para sua assistência técnica."}</p>
                    </div>
                    {isCurrent && (
                      <span className="shrink-0 rounded-full border border-primary/25 bg-primary/5 px-2.5 py-1 text-[10px] font-semibold text-primary">
                        Seu plano
                      </span>
                    )}
                  </div>

                  <div className="mt-5 border-b border-border pb-5">
                    <p className="font-heading text-3xl font-extrabold tracking-tight">
                      {brl(plan.price_monthly)}
                      <span className="ml-1 text-xs font-medium text-muted-foreground">/ mês</span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Cobrança mensal</p>
                  </div>

                  <div className="mt-4 flex-1">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">O que está incluído</p>
                    <ul className="space-y-3 text-xs">
                      <li className="flex items-start gap-2.5">
                        <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Check className="h-3 w-3" /></span>
                        <span>Até <strong>{plan.max_users}</strong> usuário(s)</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Check className="h-3 w-3" /></span>
                        <span><strong>{plan.max_orders_month}</strong> ordens por mês</span>
                      </li>
                      {(plan.features || []).map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Check className="h-3 w-3" /></span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className="mt-6 h-10 w-full gap-2"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent || Boolean(request) || Boolean(sending)}
                    onClick={() => requestPlan(plan)}
                  >
                    {sending === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : isCurrent ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    {isCurrent ? "Plano atual" : request ? "Solicitação em análise" : "Solicitar este plano"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {message && (
        <div role="status" className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {message}
        </div>
      )}
      <p className="flex items-start gap-2 px-1 text-[11px] leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        A ativação é feita após a confirmação do pagamento pela nossa equipe. Nenhum valor é cobrado automaticamente nesta tela.
      </p>
    </div>
  );
}
