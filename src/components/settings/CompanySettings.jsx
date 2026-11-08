import { useEffect, useState } from "react";
import { Loader2, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useTenant } from "@/lib/TenantContext";
import CompanyLogo from "@/components/CompanyLogo";
import { invalidateTenantCache } from "@/lib/tenant";

const FIELDS = [
  { name: "name", label: "Razão social / nome", span: 2 },
  { name: "trade_name", label: "Nome fantasia" },
  { name: "document", label: "CNPJ / CPF" },
  { name: "phone", label: "Telefone" },
  { name: "whatsapp", label: "WhatsApp" },
  { name: "email", label: "E-mail" },
  { name: "zip", label: "CEP" },
  { name: "address", label: "Endereço", span: 2 },
  { name: "address_number", label: "Número" },
  { name: "district", label: "Bairro" },
  { name: "city", label: "Cidade" },
  { name: "state", label: "UF" },
  { name: "tech_responsible", label: "Responsável técnico" },
];

export default function CompanySettings() {
  const { company, refresh } = useTenant();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (company) setForm({ ...company });
  }, [company?.id]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (event) => {
    event.preventDefault();
    if (!String(form.name || "").trim()) {
      setError("Informe o nome da empresa.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await base44.entities.Company.update(company.id, {
        name: form.name,
        trade_name: form.trade_name,
        document: form.document,
        phone: form.phone,
        whatsapp: form.whatsapp,
        email: form.email,
        zip: form.zip,
        address: form.address,
        address_number: form.address_number,
        district: form.district,
        city: form.city,
        state: form.state ? String(form.state).toUpperCase() : "",
        tech_responsible: form.tech_responsible,
      });
      invalidateTenantCache("Company");
      await refresh();
      setMessage("Dados da empresa atualizados.");
    } catch (err) {
      setError(err?.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.entities.Company.update(company.id, { logo_url: file_uri });
      invalidateTenantCache("Company");
      await refresh();
      setMessage("Logotipo atualizado.");
    } catch (err) {
      setError(err?.message || "Falha ao enviar o logotipo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-bold text-[15px]">Dados da empresa</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Aparecem no topo dos orçamentos e ordens de serviço.</p>
        </div>
        <Button type="submit" disabled={saving} className="gap-2 h-10">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <CompanyLogo
          company={form}
          className="w-16 h-16 rounded-xl object-contain border border-border bg-card"
          fallback={
            <span className="w-16 h-16 rounded-xl bg-accent text-accent-foreground grid place-items-center font-heading font-extrabold">
              GO
            </span>
          }
        />
        <label className="cursor-pointer">
          <span className="inline-flex items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm font-medium hover:bg-muted">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Enviando..." : "Enviar logotipo"}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={handleLogo} disabled={uploading} />
        </label>
      </div>

      <div className="mt-5 grid sm:grid-cols-2 gap-4">
        {FIELDS.map((field) => (
          <div key={field.name} className={field.span === 2 ? "sm:col-span-2" : ""}>
            <Label htmlFor={`company-${field.name}`} className="field-label">{field.label}</Label>
            <Input
              id={`company-${field.name}`}
              value={form[field.name] || ""}
              onChange={(e) => set(field.name, e.target.value)}
              className="mt-1.5"
            />
          </div>
        ))}
      </div>

      {message && <p className="mt-4 text-sm text-primary">{message}</p>}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </form>
  );
}
