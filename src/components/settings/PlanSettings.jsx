import { useEffect, useState } from "react";
import { Loader2, Check, Sparkles } from "lucide-react";
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
      load();
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
    <div className="space-y-4">
      <div className="surface p-5">
        <h2 className="font-heading font-bold text-[15px]">Assinatura atual</h2>
        <div className="mt-4 grid sm:grid-cols-3 gap-4">
          <div>
            <p className="field-label">Plano</p>
            <p className="text-sm font-semibold mt-1">{account?.plan_name || "Período de teste"}</p>
          </div>
          <div>
            <p className="field-label">Situação</p>
            <p className="text-sm font-semibold mt-1">{STATUS_LABELS[account?.status] || "—"}</p>
          </div>
          <div>
            <p className="field-label">Valor mensal</p>
            <p className="text-sm font-semibold mt-1">{brl(account?.price || 0)}</p>
          </div>
          <div>
            <p className="field-label">Válido até</p>
            <p className="text-sm font-semibold mt-1">
              {shortDate(account?.current_period_end || account?.trial_ends_at)}
            </p>
          </div>
        </div>
        {request && (
          <p className="mt-4 text-xs rounded-lg bg-accent/70 text-accent-foreground px-3 py-2">
            Solicitação do plano <strong>{request.plan_name}</strong> em análise desde {shortDate(request.created_date)}.
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = account?.plan_id === plan.id;
          return (
            <div
              key={plan.id}
              className={`surface p-5 flex flex-col ${plan.highlight ? "ring-2 ring-primary" : ""}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-extrabold text-base">{plan.name}</h3>
                {plan.highlight && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded">
                    Recomendado
                  </span>
                )}
              </div>
              <p className="mt-2 font-heading text-2xl font-extrabold">{brl(plan.price_monthly)}<span className="text-xs font-medium text-muted-foreground">/mês</span></p>
              <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>

              <ul className="mt-4 space-y-2 text-xs flex-1">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" /> Até {plan.max_users} usuário(s)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" /> {plan.max_orders_month} ordens por mês
                </li>
                {(plan.features || []).map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" /> {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="mt-4 gap-2"
                variant={isCurrent ? "outline" : "default"}
                disabled={isCurrent || sending === plan.id}
                onClick={() => requestPlan(plan)}
              >
                {sending === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isCurrent ? "Plano atual" : "Solicitar este plano"}
              </Button>
            </div>
          );
        })}
      </div>

      {message && <p className="text-sm text-primary">{message}</p>}
      <p className="text-[11px] text-muted-foreground">
        A ativação é feita após a confirmação do pagamento pela nossa equipe. Nenhum valor é cobrado automaticamente
        nesta tela.
      </p>
    </div>
  );
}
