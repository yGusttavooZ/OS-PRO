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
  const [form, setForm] = useState({ warranty_days: 90, warranty_terms: "", doc_footer: "", doc_start_number: 1, os_template: "profissional" });
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
      os_template: company.os_template === "referencia" ? "referencia" : "profissional",
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
        os_template: form.os_template,
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
        <div className="border-b border-border/70 px-5 py-4"><h3 className="text-sm font-semibold">Modelo da ordem de serviço</h3><p className="mt-1 text-xs text-muted-foreground">Escolha o visual usado ao imprimir ou salvar a OS em PDF.</p></div>
        <div className="grid gap-3 p-5 md:grid-cols-2">
          {[
            { id: "profissional", title: "Original", desc: "Mantém o modelo atual do OS-PRO" },
            { id: "referencia", title: "Modelo da referência", desc: "Reproduz a estrutura da imagem enviada, nas cores do OS-PRO" },
          ].map((model) => (
            <button key={model.id} type="button" onClick={() => set("os_template", model.id)} aria-pressed={form.os_template === model.id}
              className={`rounded-xl border p-3 text-left transition-colors ${form.os_template === model.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/70 hover:border-primary/50"}`}>
              <div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold">{model.title}</span>{form.os_template === model.id && <span className="text-[10px] font-semibold text-primary">Selecionado</span>}</div>
              {model.id === "referencia" ? (
                <div className="mb-3 rounded-sm border border-slate-300 bg-white p-2 shadow-sm space-y-1">
                  <div className="flex items-center gap-2 border border-slate-200 p-1">
                    <span className="h-8 w-8 shrink-0 rounded-full border-2 border-emerald-600 bg-emerald-50" />
                    <div className="min-w-0 flex-1 space-y-1"><span className="block h-1.5 w-3/4 bg-slate-500" /><span className="block h-1 w-full bg-slate-200" /><span className="block h-1 w-4/5 bg-slate-200" /></div>
                    <span className="h-5 w-12 bg-slate-100" />
                  </div>
                  <div className="h-2 bg-emerald-100" />
                  <div className="space-y-1 border border-slate-200 p-1"><div className="h-2 bg-emerald-50" /><div className="grid grid-cols-2 gap-1"><span className="h-3 border border-slate-200" /><span className="h-3 border border-slate-200" /><span className="h-3 border border-slate-200" /><span className="h-3 border border-slate-200" /></div></div>
                  <div className="h-2 bg-emerald-100" />
                  <div className="space-y-1 border border-slate-200 p-1"><span className="block h-2 bg-slate-100" /><span className="block h-2 bg-slate-100" /><span className="block h-2 w-2/3 bg-slate-100" /></div>
                  <div className="ml-auto h-3 w-1/3 bg-emerald-100" />
                  <div className="grid grid-cols-2 gap-3 px-2 pt-2"><span className="h-3 border-b border-slate-400" /><span className="h-3 border-b border-slate-400" /></div>
                </div>
              ) : (
                <div className="mb-3 rounded-lg border bg-white p-2 shadow-sm space-y-1">
                  <div className="flex items-center justify-between border-b border-emerald-600 pb-2"><span className="h-5 w-5 rounded bg-slate-300" /><span className="text-[7px] font-bold text-slate-700">OS #001</span></div>
                  <div className="grid grid-cols-2 gap-1"><span className="h-5 rounded bg-slate-100" /><span className="h-5 rounded bg-slate-100" /></div>
                  <div className="space-y-1"><span className="block h-1.5 rounded bg-slate-100" /><span className="block h-1.5 w-4/5 rounded bg-slate-100" /></div>
                  <div className="ml-auto h-4 w-1/3 rounded bg-emerald-100" />
                </div>
              )}
              <span className="text-xs text-muted-foreground">{model.desc}</span>
            </button>
          ))}
        </div>
        <p className="px-5 pb-4 text-[11px] text-muted-foreground">A escolha vale para esta empresa e também será usada ao reimprimir ordens já cadastradas.</p>
      </section>

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
