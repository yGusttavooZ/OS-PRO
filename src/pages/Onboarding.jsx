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

