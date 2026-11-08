import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";

const EMPTY = {
  name: "", price_monthly: 0, max_users: 3, max_orders_month: 100,
  description: "", features_text: "", highlight: false, sort_order: 0, active: true,
};

export default function PlanDialog({ open, onOpenChange, plan, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(
      plan
        ? {
            ...EMPTY,
            ...plan,
            features_text: (plan.features || []).join("\n"),
          }
        : EMPTY
    );
    setError("");
  }, [open, plan]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Informe o nome do plano.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        price_monthly: Number(form.price_monthly) || 0,
        max_users: Number(form.max_users) || 1,
        max_orders_month: Number(form.max_orders_month) || 0,
        description: form.description,
        features: form.features_text.split("\n").map((line) => line.trim()).filter(Boolean),
        highlight: Boolean(form.highlight),
        sort_order: Number(form.sort_order) || 0,
        active: Boolean(form.active),
      };
      if (plan?.id) await base44.entities.Plan.update(plan.id, payload);
      else await base44.entities.Plan.create(payload);
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err?.message || "Não foi possível salvar o plano.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan?.id ? "Editar plano" : "Novo plano"}</DialogTitle>
          <DialogDescription>Planos exibidos na tela de assinatura das empresas.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="plan-name" className="field-label">Nome</Label>
            <Input id="plan-name" value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1.5" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="plan-price" className="field-label">Preço/mês</Label>
              <Input id="plan-price" type="number" min="0" step="0.01" value={form.price_monthly} onChange={(e) => set("price_monthly", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="plan-users" className="field-label">Usuários</Label>
              <Input id="plan-users" type="number" min="1" value={form.max_users} onChange={(e) => set("max_users", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="plan-orders" className="field-label">OS/mês</Label>
              <Input id="plan-orders" type="number" min="0" value={form.max_orders_month} onChange={(e) => set("max_orders_month", e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label htmlFor="plan-desc" className="field-label">Descrição</Label>
            <Input id="plan-desc" value={form.description} onChange={(e) => set("description", e.target.value)} className="mt-1.5" />
          </div>

          <div>
            <Label htmlFor="plan-features" className="field-label">Diferenciais (um por linha)</Label>
            <Textarea id="plan-features" value={form.features_text} onChange={(e) => set("features_text", e.target.value)} className="mt-1.5 min-h-[90px]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="plan-order" className="field-label">Ordem</Label>
              <Input id="plan-order" type="number" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} className="mt-1.5" />
            </div>
            <div className="flex flex-col gap-3 pt-5">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={Boolean(form.highlight)} onCheckedChange={(v) => set("highlight", v)} /> Destacar
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={Boolean(form.active)} onCheckedChange={(v) => set("active", v)} /> Ativo
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Salvando..." : "Salvar plano"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
