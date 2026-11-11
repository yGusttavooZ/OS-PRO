import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useTenant } from "@/lib/TenantContext";
import { buildSearchKey } from "@/lib/tenant";

const EMPTY = {
  name: "", trade_name: "", document: "", phone: "", whatsapp: "", email: "",
  zip: "", address: "", address_number: "", district: "", city: "", state: "", notes: "",
};

const FIELDS = [
  { name: "name", label: "Nome / Razão social", span: 2, required: true, placeholder: "Nome do cliente" },
  { name: "trade_name", label: "Nome fantasia", placeholder: "Opcional" },
  { name: "document", label: "CPF / CNPJ", placeholder: "000.000.000-00" },
  { name: "phone", label: "Telefone", placeholder: "(11) 3333-0000" },
  { name: "whatsapp", label: "WhatsApp", placeholder: "(11) 99999-0000" },
  { name: "email", label: "E-mail", placeholder: "cliente@email.com" },
  { name: "zip", label: "CEP", placeholder: "00000-000" },
  { name: "address", label: "Endereço", span: 2, placeholder: "Rua, avenida..." },
  { name: "address_number", label: "Número", placeholder: "123" },
  { name: "district", label: "Bairro", placeholder: "Centro" },
  { name: "city", label: "Cidade", placeholder: "São Paulo" },
  { name: "state", label: "UF", placeholder: "SP" },
];

export default function ClientDialog({ open, onOpenChange, client, onSaved }) {
  const { company } = useTenant();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(client ? { ...EMPTY, ...client } : EMPTY);
    setError("");
  }, [open, client]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Informe o nome do cliente.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...Object.fromEntries(Object.keys(EMPTY).map((key) => [
          key,
          key === "state" ? (form[key] ? form[key].toUpperCase() : "") : (form[key] ?? ""),
        ])),
        company_id: company.id,
        active: true,
        search_key: buildSearchKey(form.name, form.trade_name, form.document, form.phone, form.whatsapp, form.email),
      };
      const saved = client?.id
        ? await base44.entities.Client.update(client.id, payload)
        : await base44.entities.Client.create(payload);
      await onSaved?.(saved);
      onOpenChange(false);
    } catch (err) {
      setError(err?.message || "Não foi possível salvar o cliente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client?.id ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            Os dados ficam disponíveis para o preenchimento automático das ordens de serviço.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {FIELDS.map((field) => (
              <div key={field.name} className={field.span === 2 ? "sm:col-span-2" : ""}>
                <Label htmlFor={`client-${field.name}`} className="field-label">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id={`client-${field.name}`}
                  value={form[field.name] || ""}
                  onChange={(e) => set(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="mt-1.5"
                  required={field.required}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Label htmlFor="client-notes" className="field-label">Observações</Label>
              <Textarea
                id="client-notes"
                value={form.notes || ""}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Preferências, histórico, condições comerciais..."
                className="mt-1.5 min-h-[70px]"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Salvando..." : "Salvar cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
