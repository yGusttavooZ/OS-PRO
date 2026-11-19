import { useEffect, useState } from "react";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, Save, ShieldCheck, Hash, FileText, Info } from "lucide-react";
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
        const start = Math.max(1, Math.floor(Number(form.doc_start_number) || 1));
        const counterRef = doc(db, "companies", company.id, "counters", "doc");
        await runTransaction(db, async (transaction) => {
          const counter = await transaction.get(counterRef);
          if (counter.exists()) {
            transaction.update(counterRef, { value: start, updated_at: serverTimestamp() });
          } else {
            transaction.set(counterRef, { key: "doc", value: start, updated_at: serverTimestamp() });
          }
        });
      }

      invalidateTenantCache("Company");
      await refresh();
      setMessage("Configurações de documento salvas.");
    } catch (err) {
      setError(err?.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-heading text-[15px] font-bold">Documentos e garantia</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Personalize as informações utilizadas nos orçamentos e ordens de serviço.
            </p>
          </div>
        </div>
        <Button type="submit" disabled={saving} className="h-10 gap-2 sm:min-w-32">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>

      <section className="surface overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border/70 px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Garantia padrão</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Defina o prazo e as condições exibidas nos documentos.</p>
          </div>
        </div>
        <div className="grid gap-4 p-5">
          <div className="max-w-xs">
            <Label htmlFor="warranty-days" className="field-label">Prazo de garantia (dias)</Label>
            <Input
              id="warranty-days"
              type="number"
              min="0"
              value={form.warranty_days}
              onChange={(e) => set("warranty_days", e.target.value)}
              className="mt-1.5 h-10"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">Informe 0 se não desejar definir um prazo padrão.</p>
          </div>
          <div>
            <Label htmlFor="warranty-terms" className="field-label">Termos e condições da garantia</Label>
            <Textarea
              id="warranty-terms"
              value={form.warranty_terms}
              onChange={(e) => set("warranty_terms", e.target.value)}
              placeholder="Descreva as condições da garantia que aparecerão nos documentos."
              className="mt-1.5 min-h-[150px] resize-y text-[13px] leading-relaxed"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">Esse texto é utilizado como padrão nos documentos da empresa.</p>
          </div>
        </div>
      </section>

      <section className="surface overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border/70 px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Hash className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Numeração dos documentos</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Configure o número inicial da sequência da empresa.</p>
          </div>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-[minmax(0,240px)_1fr] sm:items-start">
          <div>
            <Label htmlFor="doc-start" className="field-label">Numeração inicial</Label>
            <Input
              id="doc-start"
              type="number"
              min="1"
              value={form.doc_start_number}
              onChange={(e) => set("doc_start_number", e.target.value)}
              className="mt-1.5 h-10"
            />
          </div>
          <div className="flex gap-2 rounded-xl border border-border/70 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground sm:mt-6">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>A numeração é sequencial por empresa e não se repete. O novo valor inicial só é aplicado quando ainda não existem ordens de serviço cadastradas.</p>
          </div>
        </div>
      </section>

      <section className="surface overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border/70 px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Rodapé do documento</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Adicione uma informação complementar ao final do documento.</p>
          </div>
        </div>
        <div className="p-5">
          <Label htmlFor="doc-footer" className="field-label">Texto do rodapé</Label>
          <Input
            id="doc-footer"
            value={form.doc_footer}
            onChange={(e) => set("doc_footer", e.target.value)}
            placeholder="Ex.: Assistência técnica · Endereço · Telefone"
            className="mt-1.5 h-10"
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">Deixe em branco se não quiser exibir um texto adicional no rodapé.</p>
        </div>
      </section>

      {(message || error) && (
        <p role={error ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${
          error ? "border-destructive/20 bg-destructive/5 text-destructive" : "border-primary/20 bg-primary/5 text-primary"
        }`}>
          {error || message}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="h-10 min-w-36 gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
