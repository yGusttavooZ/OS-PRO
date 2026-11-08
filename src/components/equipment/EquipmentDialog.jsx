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
import { buildSearchKey, paged } from "@/lib/tenant";

const EMPTY = {
  client_id: "", name: "", brand: "", model: "", serial: "",
  accessories: "", condition: "", notes: "",
};

export default function EquipmentDialog({ open, onOpenChange, equipment, defaultClientId, onSaved }) {
  const { company } = useTenant();
  const [form, setForm] = useState(EMPTY);
  const [clients, setClients] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !company?.id) return;
    setForm(equipment ? { ...EMPTY, ...equipment } : { ...EMPTY, client_id: defaultClientId || "" });
    setError("");
    paged("Client", { company_id: company.id }, { sort: "name", limit: 300 }).then(setClients);
  }, [open, equipment, company?.id, defaultClientId]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.client_id) {
      setError("Selecione o cliente proprietário do equipamento.");
      return;
    }
    if (!form.name.trim()) {
      setError("Informe o nome do equipamento.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        company_id: company.id,
        search_key: buildSearchKey(form.name, form.brand, form.model, form.serial),
      };
      const saved = equipment?.id
        ? await base44.entities.Equipment.update(equipment.id, payload)
        : await base44.entities.Equipment.create(payload);
      onSaved?.(saved);
      onOpenChange(false);
    } catch (err) {
      setError(err?.message || "Não foi possível salvar o equipamento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{equipment?.id ? "Editar equipamento" : "Novo equipamento"}</DialogTitle>
          <DialogDescription>Fica vinculado ao cliente e disponível nas ordens de serviço.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="field-label">Cliente <span className="text-destructive">*</span></Label>
            <Select value={form.client_id} onValueChange={(v) => set("client_id", v)}>
              <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="eq-name-d" className="field-label">Equipamento <span className="text-destructive">*</span></Label>
              <Input id="eq-name-d" value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1.5" placeholder="Notebook, impressora..." />
            </div>
            <div>
              <Label htmlFor="eq-brand-d" className="field-label">Marca</Label>
              <Input id="eq-brand-d" value={form.brand || ""} onChange={(e) => set("brand", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="eq-model-d" className="field-label">Modelo</Label>
              <Input id="eq-model-d" value={form.model || ""} onChange={(e) => set("model", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="eq-serial-d" className="field-label">Nº de série</Label>
              <Input id="eq-serial-d" value={form.serial || ""} onChange={(e) => set("serial", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="eq-cond-d" className="field-label">Estado</Label>
              <Input id="eq-cond-d" value={form.condition || ""} onChange={(e) => set("condition", e.target.value)} className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="eq-acc-d" className="field-label">Acessórios</Label>
              <Input id="eq-acc-d" value={form.accessories || ""} onChange={(e) => set("accessories", e.target.value)} className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="eq-notes-d" className="field-label">Observações</Label>
              <Textarea id="eq-notes-d" value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} className="mt-1.5 min-h-[60px]" />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Salvando..." : "Salvar equipamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
