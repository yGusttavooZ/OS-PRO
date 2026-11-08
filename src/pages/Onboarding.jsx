import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Loader2, ShieldCheck, ArrowRight, CheckCircle2, MailCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useTenant } from "@/lib/TenantContext";
import { DEFAULT_WARRANTY, logAudit, myCompanyId } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELDS = [
  { name: "name", label: "Nome da empresa", placeholder: "Informática Silva", required: true, span: 2 },
  { name: "document", label: "CNPJ ou CPF", placeholder: "00.000.000/0001-00" },
  { name: "phone", label: "Telefone / WhatsApp", placeholder: "(11) 99999-0000" },
  { name: "email", label: "E-mail de contato", placeholder: "contato@empresa.com.br" },
  { name: "city", label: "Cidade", placeholder: "São Paulo" },
  { name: "state", label: "UF", placeholder: "SP" },
  { name: "tech_responsible", label: "Responsável técnico", placeholder: "Nome do responsável" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { company, refresh } = useTenant();
  const [form, setForm] = useState({ name: "", document: "", phone: "", email: "", city: "", state: "", tech_responsible: "" });
  const [invite, setInvite] = useState(null);
  const [checkingInvite, setCheckingInvite] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user?.email) return;
      try {
        const rows = await base44.entities.Membership.filter({ user_email: user.email });
        const pending = (Array.isArray(rows) ? rows : rows?.items || []).find((m) => m.status !== "inactive");
        if (alive) setInvite(pending || null);
      } catch {
        if (alive) setInvite(null);
      } finally {
        if (alive) setCheckingInvite(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.email]);

  useEffect(() => {
    if (company || myCompanyId(user)) navigate("/", { replace: true });
  }, [company, user, navigate]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const acceptInvite = async () => {
    setSaving(true);
    setError("");
    try {
      await base44.auth.updateMe({
        company_id: invite.company_id,
        company_name: invite.company_name || "",
        company_role: invite.role,
      });
      await base44.entities.Membership.update(invite.id, {
        user_id: user.id,
        user_name: user.full_name || user.email,
        status: "active",
      });
      await refresh();
      window.location.href = "/";
    } catch (err) {
      setError(err?.message || "Não foi possível aceitar o convite.");
      setSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Informe o nome da empresa.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await base44.entities.Company.create({
        name: form.name.trim(),
        legal_name: form.name.trim(),
        trade_name: form.name.trim(),
        document: form.document,
        phone: form.phone,
        whatsapp: form.phone,
        email: form.email || user.email,
        city: form.city,
        state: form.state ? form.state.toUpperCase() : "",
        tech_responsible: form.tech_responsible || user.full_name || "",
        owner_email: user.email,
        warranty_terms: DEFAULT_WARRANTY,
        warranty_days: 90,
        doc_start_number: 1,
      });

      await base44.entities.Company.update(created.id, { company_id: created.id });

      await base44.auth.updateMe({
        company_id: created.id,
        company_name: created.name,
        company_role: "admin",
      });

      await base44.entities.Membership.create({
        company_id: created.id,
        company_name: created.name,
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name || user.email,
        role: "admin",
        status: "active",
      });

      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      await base44.entities.CompanyAccount.create({
        company_id: created.id,
        company_name: created.name,
        status: "trial",
        plan_id: "",
        plan_name: "Período de teste",
        price: 0,
        trial_ends_at: trialEnd,
        contact_email: user.email,
      });

      await base44.entities.Counter.create({ company_id: created.id, key: "doc", value: 2 });
      await logAudit(created, user, "create_company", created.name, "Empresa criada no onboarding");
      await refresh();
      window.location.href = "/";
    } catch (err) {
      setError(err?.message || "Não foi possível criar a empresa. Tente novamente.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="grid lg:grid-cols-[1fr_1.1fr] min-h-screen">
        <aside className="auth-panel relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:p-14">
          <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-20 top-16 h-72 w-72 rounded-full bg-[hsl(152_70%_48%_/_0.16)] blur-[100px]" aria-hidden="true" />
          <div className="relative flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-white/25 to-white/[0.06] font-heading text-[11px] font-extrabold tracking-[0.08em] ring-1 ring-white/20 backdrop-blur">
              OS
            </span>
            <span className="font-heading text-lg font-extrabold tracking-[-0.02em]">OS PRO</span>
          </div>
          <div className="relative">
            <h1 className="font-heading text-[32px] font-extrabold leading-[1.1] tracking-[-0.03em]">
              Configure sua assistência técnica em poucos minutos
            </h1>
            <p className="mt-3 text-primary-foreground/75 text-sm max-w-sm">
              Cada empresa tem seu próprio espaço isolado: clientes, equipamentos, ordens de serviço e financeiro
              separados dos demais.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Ordens de serviço numeradas automaticamente",
                "Orçamentos com conversão em OS",
                "Documentos em PDF com a sua marca",
                "Financeiro com receitas e despesas",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-primary-foreground/90">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative flex items-center gap-2 text-[11px] text-white/40">
            <ShieldCheck className="h-3.5 w-3.5" /> Seus dados ficam visíveis apenas para a sua equipe
          </p>
        </aside>

        <main className="relative flex items-center justify-center overflow-hidden p-4 sm:p-10">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary/[0.08] blur-[110px]" />
            <div className="absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-chart-3/[0.09] blur-[110px]" />
          </div>
          <div className="auth-card relative w-full max-w-xl animate-rise rounded-[26px] border border-border/70 bg-card p-6 sm:p-9">
            <div className="lg:hidden flex items-center gap-2.5 mb-8">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-chart-3 font-heading text-[11px] font-extrabold text-primary-foreground">
                OS
              </span>
              <span className="font-heading font-extrabold text-lg">OS PRO</span>
            </div>

            {checkingInvite ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Verificando convites...
              </div>
            ) : invite ? (
              <>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-accent to-card text-primary ring-1 ring-primary/10 shadow-[0_12px_26px_-18px_hsl(var(--primary)/0.7)]">
                  <MailCheck className="h-5 w-5" />
                </span>
                <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight">Convite para uma equipe</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Você foi convidado para participar de <strong className="text-foreground">{invite.company_name || "uma empresa"}</strong> como{" "}
                  {invite.role === "admin" ? "administrador" : invite.role === "technician" ? "técnico" : "atendente"}.
                </p>
                {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
                <Button onClick={acceptInvite} disabled={saving} className="cta-gradient mt-6 h-11 w-full gap-2 rounded-xl font-semibold text-white shadow-lg shadow-primary/25">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "Entrando..." : "Aceitar convite e entrar"}
                </Button>
                <p className="mt-4 text-xs text-muted-foreground">
                  Prefere abrir sua própria assistência técnica?{" "}
                  <button type="button" onClick={() => setInvite(null)} className="font-semibold text-primary hover:underline">
                    Criar uma empresa
                  </button>
                </p>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-accent to-card text-primary ring-1 ring-primary/10 shadow-[0_12px_26px_-18px_hsl(var(--primary)/0.7)]">
                  <Building2 className="h-5 w-5" />
                </span>
                <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight">Cadastre sua empresa</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Olá, {user?.full_name?.split(" ")[0] || "bem-vindo"}. Esses dados aparecem nos documentos emitidos.
                </p>

                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  {FIELDS.map((field) => (
                    <div key={field.name} className={field.span === 2 ? "sm:col-span-2" : ""}>
                      <Label htmlFor={field.name} className="field-label">
                        {field.label} {field.required && <span className="text-destructive">*</span>}
                      </Label>
                      <Input
                        id={field.name}
                        value={form[field.name]}
                        onChange={(e) => update(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        className="mt-1.5 h-11 rounded-xl border-border/70 bg-muted/40 text-[13.5px] transition-all focus-visible:border-primary/40 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/15"
                        required={field.required}
                      />
                    </div>
                  ))}
                </div>

                {error && (
                  <p className="mt-4 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" disabled={saving} className="cta-gradient mt-6 h-11 w-full gap-2 rounded-xl font-semibold text-white shadow-lg shadow-primary/25">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? "Criando sua empresa..." : "Criar empresa e começar"}
                  {!saving && <ArrowRight className="w-4 h-4" />}
                </Button>

                <p className="mt-4 text-xs text-muted-foreground">
                  Você entra no período de teste de 14 dias. Nenhum cartão é solicitado agora.
                </p>
              </form>
            )}

            <button
              type="button"
              onClick={() => logout(true)}
              className="mt-6 text-xs text-muted-foreground hover:text-foreground"
            >
              Sair desta conta
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
