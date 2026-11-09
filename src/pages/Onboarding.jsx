import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Loader2, ShieldCheck, ArrowRight, CheckCircle2, MailCheck } from "lucide-react";
import { acceptCompanyInvite, createCompanyForUser, findPendingInvite, writeCompanyAudit } from "@/lib/firestoreTenant";
import { useAuth } from "@/lib/AuthContext";
import { useTenant } from "@/lib/TenantContext";
import { myCompanyId } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELDS = [
  { name: "name", label: "Nome da empresa", placeholder: "Informática Silva", required: true, span: 2 },
  { name: "document", label: "CNPJ ou CPF", placeholder: "00.000.000/0001-00" },
  { name: "phone", label: "Telefone / WhatsApp", placeholder: "(11) 99999-0000" },
  { name: "email", label: "E-mail de contato", placeholder: "contato@empresa.com.br" },
  { name: "city", label: "Cidade", placeholder: "São Paulo" },
  { name: "state", label: "UF", placeholder: "SP", maxLength: 2 },
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
    if (company || myCompanyId(user)) navigate("/", { replace: true });
  }, [company, user, navigate]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

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

  if (checkingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
        <span className="ml-3 text-sm text-slate-600">Verificando convites...</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-900 p-3 text-white"><Building2 className="h-6 w-6" /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Configurar empresa</h1>
              <p className="text-sm text-slate-500">Falta pouco para começar a usar o OS-PRO.</p>
            </div>
          </div>
          <Button type="button" variant="ghost" onClick={logout}>Sair</Button>
        </header>

        {invite ? (
          <section className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-blue-50 p-3 text-blue-700"><MailCheck className="h-6 w-6" /></div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Você recebeu um convite</h2>
                <p className="text-sm text-slate-600">Há um convite de acesso a uma empresa associado ao seu e-mail.</p>
              </div>
            </div>
            <p className="mb-5 text-sm text-slate-700">Empresa: <strong>{invite.company_name || "Empresa convidante"}</strong></p>
            {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <Button onClick={acceptInvite} disabled={saving} className="w-full">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Aceitar convite
            </Button>
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="rounded-full bg-emerald-50 p-3 text-emerald-700"><ShieldCheck className="h-6 w-6" /></div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Cadastre sua empresa</h2>
                <p className="text-sm text-slate-600">Essas informações serão usadas nas ordens de serviço e nas configurações.</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {FIELDS.map((field) => (
                  <div key={field.name} className={field.span === 2 ? "sm:col-span-2" : ""}>
                    <Label htmlFor={field.name}>{field.label}{field.required ? " *" : ""}</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={form[field.name]}
                      onChange={(event) => update(field.name, field.name === "state" ? event.target.value.toUpperCase() : event.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      maxLength={field.maxLength}
                    />
                  </div>
                ))}
              </div>
              {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                Criar empresa e continuar
              </Button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
