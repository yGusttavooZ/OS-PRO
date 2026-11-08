import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

const STATUSES = [
  { value: "trial", label: "Período de teste" },
  { value: "awaiting_payment", label: "Aguardando pagamento" },
  { value: "active", label: "Ativo" },
  { value: "suspended", label: "Suspenso" },
  { value: "canceled", label: "Cancelado" },
];

export default function CompanyAccountDialog({ open, onOpenChange, company, account, plans, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({
      status: account?.status || "trial",
      plan_id: account?.plan_id || "",
      plan_name: account?.plan_name || "",
      price: Number(account?.price || 0),
      trial_ends_at: (account?.trial_ends_at || "").slice(0, 10),
      current_period_end: (account?.current_period_end || "").slice(0, 10),
      notes: account?.notes || "",
    });
    setError("");
  }, [open, account]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const choosePlan = (planId) => {
    const plan = plans.find((item) => item.id === planId);
    setForm((prev) => ({
      ...prev,
      plan_id: planId,
      plan_name: plan?.name || prev.plan_name,
      price: Number(plan?.price_monthly || 0),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        company_id: company.id,
        company_name: company.name,
        status: form.status,
        plan_id: form.plan_id,
        plan_name: form.plan_name,
        price: Number(form.price) || 0,
        trial_ends_at: form.trial_ends_at ? new Date(form.trial_ends_at).toISOString() : "",
        current_period_end: form.current_period_end ? new Date(form.current_period_end).toISOString() : "",
        notes: form.notes,
      };
      if (account?.id) await base44.entities.CompanyAccount.update(account.id, payload);
      else await base44.entities.CompanyAccount.create(payload);
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err?.message || "Não foi possível salvar a assinatura.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assinatura · {company?.name}</DialogTitle>
          <DialogDescription>
            A situação aqui definida controla o acesso da empresa ao sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="field-label">Situação</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="field-label">Plano</Label>
              <Select value={form.plan_id || "none"} onValueChange={(v) => choosePlan(v === "none" ? "" : v)}>
                <SelectTrigger className="mt-1.5 h-10"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem plano</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="acc-price" className="field-label">Valor (R$)</Label>
              <Input id="acc-price" type="number" min="0" step="0.01" value={form.price ?? 0} onChange={(e) => set("price", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="acc-trial" className="field-label">Fim do teste</Label>
              <Input id="acc-trial" type="date" value={form.trial_ends_at || ""} onChange={(e) => set("trial_ends_at", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="acc-period" className="field-label">Próx. vencimento</Label>
              <Input id="acc-period" type="date" value={form.current_period_end || ""} onChange={(e) => set("current_period_end", e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label htmlFor="acc-notes" className="field-label">Anotações internas</Label>
            <Textarea id="acc-notes" value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} className="mt-1.5 min-h-[70px]" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Salvando..." : "Salvar assinatura"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
