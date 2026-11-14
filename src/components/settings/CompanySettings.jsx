import { useEffect, useRef, useState } from "react";
import { Building2, Contact, Loader2, MapPin, Phone, Save, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCompany } from "@/lib/firestoreTenant";
import { useTenant } from "@/lib/TenantContext";
import CompanyLogo from "@/components/CompanyLogo";
import { invalidateTenantCache } from "@/lib/tenant";

const COMPANY_SECTIONS = [
  {
    title: "Identificação",
    description: "Informações cadastrais que identificam sua assistência.",
    icon: Building2,
    fields: [
      { name: "name", label: "Razão social / nome", span: 2 },
      { name: "trade_name", label: "Nome fantasia" },
      { name: "document", label: "CNPJ / CPF" },
      { name: "tech_responsible", label: "Responsável técnico", span: 2 },
    ],
  },
  {
    title: "Contato",
    description: "Canais de contato exibidos nos documentos da empresa.",
    icon: Phone,
    fields: [
      { name: "phone", label: "Telefone" },
      { name: "whatsapp", label: "WhatsApp" },
      { name: "email", label: "E-mail", span: 2 },
    ],
  },
  {
    title: "Endereço",
    description: "Localização e endereço que serão apresentados nos documentos.",
    icon: MapPin,
    fields: [
      { name: "zip", label: "CEP" },
      { name: "address", label: "Endereço", span: 2 },
      { name: "address_number", label: "Número" },
      { name: "district", label: "Bairro" },
      { name: "city", label: "Cidade" },
      { name: "state", label: "UF" },
    ],
  },
];

const MAX_LOGO_BYTES = 350 * 1024;

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith("image/")) {
      reject(new Error("Selecione um arquivo de imagem válido."));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("A imagem deve ter no máximo 5 MB."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error("O arquivo selecionado não é uma imagem válida."));
      image.onload = () => {
        const maxDimension = 600;
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Não foi possível processar a imagem."));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/webp", 0.8);
        const base64Size = Math.ceil((dataUrl.length - dataUrl.indexOf(",") - 1) * 3 / 4);
        if (base64Size > MAX_LOGO_BYTES) {
          reject(new Error("A imagem ficou muito grande. Escolha uma imagem mais simples ou menor."));
          return;
        }
        resolve(dataUrl);
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

export default function CompanySettings() {
  const { company, refresh } = useTenant();
  const [form, setForm] = useState({});
  const logoInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [processingLogo, setProcessingLogo] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (company) setForm({ ...company });
  }, [company?.id]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setProcessingLogo(true);
    setError("");
    setMessage("");
    try {
      const logo = await readImageFile(file);
      set("logo_base64", logo);
      set("logo_url", "");
      setMessage("Pré-visualização atualizada. Clique em Salvar para gravar a logo.");
    } catch (err) {
      setError(err?.message || "Não foi possível carregar a logo.");
    } finally {
      setProcessingLogo(false);
    }
  };

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
        logo_base64: form.logo_base64 || "",
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

  const hasLogo = Boolean(form.logo_base64 || form.logo_url);

  const renderFields = (fields) => (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.name} className={field.span === 2 ? "sm:col-span-2" : ""}>
          <Label htmlFor={"company-" + field.name} className="field-label">{field.label}</Label>
          <Input
            id={"company-" + field.name}
            value={form[field.name] || ""}
            onChange={(e) => set(field.name, e.target.value)}
            className="mt-1.5"
          />
        </div>
      ))}
    </div>
  );

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-heading text-[15px] font-bold">Dados da empresa</h2>
              <p className="mt-1 text-xs text-muted-foreground">Gerencie as informações que aparecem nos orçamentos e ordens de serviço.</p>
            </div>
          </div>
          <Button type="submit" disabled={saving || processingLogo} className="h-10 gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>

      <section className="surface overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Contact className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Logotipo da empresa</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">A marca será utilizada nos documentos impressos.</p>
          </div>
        </div>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <CompanyLogo
            company={form}
            className="h-20 w-20 shrink-0 rounded-xl border border-border bg-card object-contain p-2"
            fallback={
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-xl border border-border bg-accent font-heading text-lg font-extrabold text-accent-foreground">
                GO
              </span>
            }
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{hasLogo ? "Logotipo selecionado" : "Nenhum logotipo cadastrado"}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Use uma imagem PNG, JPG ou WebP de até 5 MB. Ela será ajustada automaticamente para uso nos documentos.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                ref={logoInputRef}
                id="company-logo-file"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleLogoChange}
                disabled={processingLogo || saving}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                disabled={processingLogo || saving}
                onClick={() => logoInputRef.current?.click()}
                className="h-9 gap-2"
              >
                {processingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {processingLogo ? "Processando..." : "Enviar logotipo"}
              </Button>
              {hasLogo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={processingLogo || saving}
                  onClick={() => {
                    set("logo_base64", "");
                    set("logo_url", "");
                    setMessage("Logo removida da pré-visualização. Clique em Salvar para confirmar.");
                  }}
                  className="h-9 gap-1.5 text-muted-foreground"
                >
                  <X className="h-4 w-4" /> Remover
                </Button>
              )}
            </div>
            {processingLogo && <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Processando imagem...</p>}
          </div>
        </div>
      </section>

      {COMPANY_SECTIONS.map((section) => {
        const SectionIcon = section.icon;
        return (
          <section key={section.title} className="surface overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                <SectionIcon className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">{section.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{section.description}</p>
              </div>
            </div>
            <div className="p-5">
              {renderFields(section.fields)}
            </div>
          </section>
        );
      })}

      {(message || error) && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-primary/20 bg-primary/5 text-primary"}`}
        >
          {error || message}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving || processingLogo} className="h-10 gap-2 px-6">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
