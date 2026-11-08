import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useTenant } from "@/lib/TenantContext";
import { todayISO } from "@/lib/format";

const METHODS = ["PIX", "Dinheiro", "Cartão de crédito", "Cartão de débito", "Transferência", "Boleto", "Outro"];

export default function TransactionDialog({ open, onOpenChange, order, transaction, onSaved }) {
  const { company, user } = useTenant();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (transaction) {
      setForm({
        type: transaction.type,
        status: transaction.status,
        amount: Number(transaction.amount) || 0,
        category: transaction.category || "",
        description: transaction.description || "",
        payment_method: transaction.payment_method || "PIX",
        reference_date: transaction.reference_date || todayISO(),
        notes: transaction.notes || "",
      });
    } else {
      setForm({
        type: "income",
        status: "received",
        amount: order?.total ? Number(order.total) : 0,
        category: order ? "Ordem de serviço" : "Serviço",
        description: order ? `Recebimento da ${order.number_label}` : "",
        payment_method: "PIX",
        reference_date: todayISO(),
        notes: "",
      });
    }
    setError("");
  }, [open, order, transaction]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        company_id: company.id,
        type: form.type,
        status: form.type === "expense" ? (form.status === "pending" ? "pending" : "paid") : form.status,
        category: form.category,
        description: form.description,
        amount,
        payment_method: form.payment_method,
        reference_date: form.reference_date || todayISO(),
        notes: form.notes,
        order_id: transaction?.order_id || order?.id || "",
        order_label: transaction?.order_label || order?.number_label || "",
        client_id: transaction?.client_id || order?.client_id || "",
        client_name: transaction?.client_name || order?.client_name || "",
        created_by_name: transaction?.created_by_name || user?.full_name || user?.email || "",
      };
      const saved = transaction?.id
        ? await base44.entities.Transaction.update(transaction.id, payload)
        : await base44.entities.Transaction.create(payload);
      onSaved?.(saved);
      onOpenChange(false);
    } catch (err) {
      setError(err?.message || "Não foi possível registrar o lançamento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{transaction?.id ? "Editar lançamento" : "Novo lançamento financeiro"}</DialogTitle>
          <DialogDescription>
            {order
              ? `Vinculado à ${order.number_label} · ${order.client_name}`
              : transaction?.order_label
              ? `Vinculado à ${transaction.order_label}`
              : "Registre uma receita ou despesa da empresa."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="field-label">Tipo</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="field-label">Situação</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {form.type === "expense" ? (
                    <>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="pending">A pagar</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="received">Recebido</SelectItem>
                      <SelectItem value="pending">A receber</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="amount" className="field-label">Valor (R$)</Label>
              <Input id="amount" type="number" min="0" step="0.01" value={form.amount ?? 0} onChange={(e) => set("amount", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="ref" className="field-label">Data de referência</Label>
              <Input id="ref" type="date" value={form.reference_date || ""} onChange={(e) => set("reference_date", e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="category" className="field-label">Categoria</Label>
              <Input id="category" value={form.category || ""} onChange={(e) => set("category", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label className="field-label">Forma de pagamento</Label>
              <Select value={form.payment_method} onValueChange={(v) => set("payment_method", v)}>
                <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METHODS.map((method) => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="field-label">Descrição</Label>
            <Input id="description" value={form.description || ""} onChange={(e) => set("description", e.target.value)} className="mt-1.5" />
          </div>

          <div>
            <Label htmlFor="tx-notes" className="field-label">Observações</Label>
            <Textarea id="tx-notes" value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} className="mt-1.5 min-h-[60px]" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Salvando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
