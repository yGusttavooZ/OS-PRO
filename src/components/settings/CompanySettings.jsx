import { useEffect, useState } from "react";
import { Loader2, Save, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCompany } from "@/lib/firestoreTenant";
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
      await updateCompany(company.id, {
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
        logo_url: String(form.logo_url || "").trim(),
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
        <div className="flex-1 min-w-0">
          <Label htmlFor="company-logo-url" className="field-label">URL pública do logotipo</Label>
          <div className="relative mt-1.5">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="company-logo-url"
              type="url"
              value={form.logo_url || ""}
              onChange={(e) => set("logo_url", e.target.value)}
              placeholder="https://exemplo.com/minha-logo.png"
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Use um link público direto para a imagem. A alteração será salva junto com os dados da empresa.</p>
        </div>
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
