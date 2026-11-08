import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useTenant } from "@/lib/TenantContext";
import { DEFAULT_WARRANTY, invalidateTenantCache } from "@/lib/tenant";

export default function DocumentsSettings() {
  const { company, refresh } = useTenant();
  const [form, setForm] = useState({ warranty_days: 90, warranty_terms: "", doc_footer: "", doc_start_number: 1 });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!company) return;
    setForm({
      warranty_days: Number(company.warranty_days) || 90,
      warranty_terms: company.warranty_terms || DEFAULT_WARRANTY,
      doc_footer: company.doc_footer || "",
      doc_start_number: Number(company.doc_start_number) || 1,
    });
  }, [company?.id]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await base44.entities.Company.update(company.id, {
        warranty_days: Number(form.warranty_days) || 0,
        warranty_terms: form.warranty_terms,
        doc_footer: form.doc_footer,
        doc_start_number: Number(form.doc_start_number) || 1,
      });

      const existing = await base44.entities.ServiceOrder.count({ company_id: company.id });
      if (existing === 0) {
        const rows = await base44.entities.Counter.filter({ company_id: company.id, key: "doc" });
        const start = Number(form.doc_start_number) || 1;
        if (rows[0]) await base44.entities.Counter.update(rows[0].id, { value: start + 1 });
        else await base44.entities.Counter.create({ company_id: company.id, key: "doc", value: start + 1 });
      }

      invalidateTenantCache("Company", "Counter");
      await refresh();
      setMessage("Configurações de documento salvas.");
    } catch (err) {
      setError(err?.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-bold text-[15px]">Documentos e garantia</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Textos e numeração usados nos orçamentos e ordens de serviço.
          </p>
        </div>
        <Button type="submit" disabled={saving} className="gap-2 h-10">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="mt-5 grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="warranty-days" className="field-label">Garantia padrão (dias)</Label>
          <Input
            id="warranty-days"
            type="number"
            min="0"
            value={form.warranty_days}
            onChange={(e) => set("warranty_days", e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="doc-start" className="field-label">Numeração inicial</Label>
          <Input
            id="doc-start"
            type="number"
            min="1"
            value={form.doc_start_number}
            onChange={(e) => set("doc_start_number", e.target.value)}
            className="mt-1.5"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            A numeração é sequencial por empresa e nunca se repete. O novo valor vale quando ainda não houver documentos.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor="warranty-terms" className="field-label">Termos de garantia do documento</Label>
        <Textarea
          id="warranty-terms"
          value={form.warranty_terms}
          onChange={(e) => set("warranty_terms", e.target.value)}
          className="mt-1.5 min-h-[140px] text-[13px]"
        />
      </div>

      <div className="mt-4">
        <Label htmlFor="doc-footer" className="field-label">Rodapé do documento</Label>
        <Input
          id="doc-footer"
          value={form.doc_footer}
          onChange={(e) => set("doc_footer", e.target.value)}
          placeholder="Ex.: Assistência técnica autorizada · Rua das Flores, 120"
          className="mt-1.5"
        />
      </div>

      {message && <p className="mt-4 text-sm text-primary">{message}</p>}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </form>
  );
}
