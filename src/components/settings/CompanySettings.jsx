import { useEffect, useState } from "react";
import { Loader2, Save, X } from "lucide-react";
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

  return (
    <form onSubmit={handleSave} className="surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-bold text-[15px]">Dados da empresa</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Aparecem no topo dos orçamentos e ordens de serviço.</p>
        </div>
        <Button type="submit" disabled={saving || processingLogo} className="gap-2 h-10">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
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
          <Label htmlFor="company-logo-file" className="field-label">Logotipo da empresa</Label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Input
              id="company-logo-file"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleLogoChange}
              disabled={processingLogo || saving}
              className="max-w-sm"
            />
            {hasLogo && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={processingLogo || saving}
                onClick={() => {
                  set("logo_base64", "");
                  set("logo_url", "");
                  setMessage("Logo removida da pré-visualização. Clique em Salvar para confirmar.");
                }}
                className="gap-1.5"
              >
                <X className="w-4 h-4" /> Remover
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Selecione PNG, JPG, WEBP ou GIF. Máximo de 5 MB; a imagem será otimizada antes de ser salva.
          </p>
          {processingLogo && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Processando imagem...</p>}
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
