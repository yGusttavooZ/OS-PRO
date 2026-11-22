import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Loader2, ShieldCheck, ArrowRight, CheckCircle2, MailCheck,
  ClipboardCheck, MapPin, Phone, FileText, Wrench, LogOut,
} from "lucide-react";
import { acceptCompanyInvite, createCompanyForUser, findPendingInvite, writeCompanyAudit } from "@/lib/firestoreTenant";
import { useAuth } from "@/lib/AuthContext";
import { useTenant } from "@/lib/TenantContext";
import { AccessRevoked } from "@/components/RequireCompany";
import { myCompanyId } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatTaxId(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 14);

  if (digits.length > 11) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  const mobile = digits[2] === "9";
  if (mobile) {
    return digits.length <= 7
      ? `(${digits.slice(0, 2)}) ${digits.slice(2)}`
      : `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return digits.length <= 6
    ? `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    : `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
}

const FIELDS = [
  { name: "name", label: "Nome da empresa", placeholder: "Ex.: Informática Silva", required: true, span: 2, icon: Building2 },
  { name: "document", label: "CNPJ ou CPF", placeholder: "00.000.000/0001-00", icon: FileText },
  { name: "phone", label: "Telefone / WhatsApp", placeholder: "(11) 99999-0000", icon: Phone },
  { name: "email", label: "E-mail de contato", placeholder: "contato@empresa.com.br", icon: MailCheck },
  { name: "city", label: "Cidade", placeholder: "Sua cidade", icon: MapPin },
  { name: "state", label: "Estado (UF)", placeholder: "UF", maxLength: 2 },
  { name: "tech_responsible", label: "Responsável técnico", placeholder: "Nome do responsável", span: 2, icon: Wrench },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { company, refresh, accessRevoked } = useTenant();
  const [form, setForm] = useState({ name: "", document: "", phone: "", email: "", city: "", state: "", tech_responsible: "" });
  const [invite, setInvite] = useState(null);
  const [checkingInvite, setCheckingInvite] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user?.email) {
        if (alive) setCheckingInvite(false);
        return;
      }
      try {
        const pending = await findPendingInvite(user.email);
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
    if (!accessRevoked && (company || myCompanyId(user))) navigate("/", { replace: true });
  }, [company, user, navigate, accessRevoked]);

  const update = (key, value) => setForm((prev) => ({
    ...prev,
    [key]: key === "document" ? formatTaxId(value) : key === "phone" ? formatPhone(value) : value,
  }));

  const acceptInvite = async () => {
    if (!invite) return;
    setSaving(true);
    setError("");
    try {
      await acceptCompanyInvite({ user, invite });
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
      const created = await createCompanyForUser({ user, form });
      await writeCompanyAudit(created.id, user, "create_company", created.name, "Empresa criada no onboarding");
      await refresh();
      window.location.href = "/";
    } catch (err) {
      setError(err?.message || "Não foi possível cadastrar a empresa.");
      setSaving(false);
    }
  };

  if (accessRevoked && !invite) return <AccessRevoked />;

  if (checkingInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
        <span className="ml-3 text-sm text-slate-600">Verificando convites...</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7f6] p-3 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_80px_-36px_rgba(15,23,42,0.28)] lg:grid-cols-[0.82fr_1.18fr]">
        <aside className="relative flex flex-col justify-between overflow-hidden bg-[#102d29] px-7 py-8 text-white sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-12 top-36 h-48 w-48 rounded-full border border-white/10" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400 text-[#102d29] shadow-lg shadow-black/10">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight">OS-PRO</div>
                <div className="text-xs text-emerald-100/70">Gestão inteligente de serviços</div>
              </div>
            </div>

            <div className="mt-14 max-w-md">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                {invite ? "Acesso à equipe" : "Vamos começar"}
              </p>
              <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                {invite ? "Sua equipe está esperando por você." : "Sua assistência técnica, organizada em um só lugar."}
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-6 text-slate-300">
                {invite
                  ? "Confirme o convite para acessar o ambiente de trabalho da sua empresa."
                  : "Configure os dados da empresa para preparar seu ambiente de ordens de serviço, clientes e equipamentos."}
              </p>
            </div>

            {!invite && (
              <div className="mt-10 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 text-emerald-300"><Building2 className="h-4 w-4" /></div>
                  <div><p className="text-sm font-medium">Dados da empresa</p><p className="mt-1 text-xs leading-5 text-slate-400">Identificação e informações de contato.</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 text-emerald-300"><ClipboardCheck className="h-4 w-4" /></div>
                  <div><p className="text-sm font-medium">Ambiente pronto para usar</p><p className="mt-1 text-xs leading-5 text-slate-400">Depois do cadastro, você poderá começar a registrar serviços.</p></div>
                </div>
              </div>
            )}
          </div>

          <div className="relative mt-12 border-t border-white/10 pt-5 text-xs text-slate-400">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Seus dados ficam protegidos por acesso individual.</div>
            <p className="mt-3 text-slate-500">© {new Date().getFullYear()} OS-PRO</p>
          </div>
        </aside>

        <section className="flex flex-col px-5 py-7 sm:px-9 sm:py-10 lg:px-12">
          <header className="mb-9 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">{invite ? "Convite recebido" : "Configuração inicial"}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                {invite ? "Acesse sua equipe" : "Cadastre sua empresa"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {invite ? "Revise as informações e confirme sua entrada." : "Preencha os dados abaixo para criar seu ambiente no OS-PRO."}
              </p>
            </div>
            <Button type="button" variant="ghost" onClick={logout} className="shrink-0 text-slate-500 hover:text-slate-900">
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </header>

          {invite ? (
            <div className="my-auto rounded-2xl border border-blue-100 bg-blue-50/50 p-5 sm:p-7">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm"><MailCheck className="h-6 w-6" /></div>
              <h3 className="text-lg font-semibold text-slate-900">Convite para acessar uma empresa</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Sua conta de funcionário está pronta. Aceite o convite para entrar na equipe.</p>
              <div className="mt-6 rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-700">
                <span className="text-slate-500">Empresa</span>
                <p className="mt-1 font-semibold text-slate-900">{invite.company_name || "Empresa convidante"}</p>
              </div>
              {error && <p role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <Button onClick={acceptInvite} disabled={saving} className="mt-6 h-11 w-full bg-emerald-700 hover:bg-emerald-800">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Aceitar convite
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-7 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold text-white">1</div>
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium text-slate-500">Etapa 1 de 1 · Dados da empresa</span>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
                <div className="mb-5 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-700" />
                  <h3 className="text-sm font-semibold text-slate-800">Informações cadastrais</h3>
                  <span className="ml-auto text-xs text-slate-400">* Obrigatório</span>
                </div>
                <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                  {FIELDS.map((field) => {
                    const FieldIcon = field.icon;
                    return (
                      <div key={field.name} className={field.span === 2 ? "sm:col-span-2" : ""}>
                        <Label htmlFor={field.name} className="mb-2 block text-[13px] font-medium text-slate-700">
                          {field.label}{field.required ? " *" : ""}
                        </Label>
                        <div className="relative">
                          {FieldIcon && <FieldIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
                          <Input
                            id={field.name}
                            name={field.name}
                            value={form[field.name]}
                            onChange={(event) => update(field.name, field.name === "state" ? event.target.value.toUpperCase() : event.target.value)}
                            placeholder={field.placeholder}
                            required={field.required}
                            maxLength={field.maxLength}
                            autoComplete={field.name === "email" ? "email" : field.name === "name" ? "organization" : "off"}
                            className={`h-11 rounded-xl border-slate-200 bg-slate-50/70 ${FieldIcon ? "pl-10" : ""} focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {error && <p role="alert" className="mt-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <div className="mt-auto pt-8">
                  <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="h-4 w-4 text-emerald-700" />
                    Você poderá revisar e complementar os dados nas configurações depois.
                  </div>
                  <Button type="submit" disabled={saving} className="h-12 w-full rounded-xl bg-emerald-700 text-sm font-semibold shadow-lg shadow-emerald-900/10 hover:bg-emerald-800">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                    Criar empresa e continuar
                  </Button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
