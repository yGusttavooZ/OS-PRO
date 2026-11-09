import { useEffect, useState } from "react";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useTenant } from "@/lib/TenantContext";
import { COMPANY_ROLES, invalidateTenantCache, paged } from "@/lib/tenant";

export default function TeamSettings() {
  const { company, user } = useTenant();
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", role: "attendant" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const rows = await paged("Membership", { company_id: company.id }, { sort: "created_date", limit: 100 });
      setMembers(rows);
    } catch (err) {
      setError(err?.message || "Não foi possível carregar a equipe.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [company?.id]);

  const invite = async (event) => {
    event.preventDefault();
    if (!form.email.trim()) {
      setError("Informe o e-mail do convidado.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      try {
        await base44.users.inviteUser(form.email.trim(), "user");
      } catch {
        /* usuário já cadastrado: segue criando o vínculo */
      }
      await base44.entities.Membership.create({
        company_id: company.id,
        company_name: company.name,
        user_email: form.email.trim().toLowerCase(),
        user_name: form.name.trim(),
        role: form.role,
        status: "invited",
      });
      setForm({ name: "", email: "", role: "attendant" });
      setMessage("Convite registrado. O acesso é liberado no primeiro login do convidado.");
      invalidateTenantCache("Membership");
      load();
    } catch (err) {
      setError(err?.message || "Não foi possível convidar.");
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (member, role) => {
    setError("");
    try {
      await base44.entities.Membership.update(member.id, { role });
      invalidateTenantCache("Membership");
      await load();
    } catch (err) {
      setError(err?.message || "Não foi possível alterar o perfil do membro.");
    }
  };

  const toggleStatus = async (member) => {
    setError("");
    const status = member.user_id
      ? (member.status === "inactive" ? "active" : "inactive")
      : (member.status === "inactive" ? "invited" : "inactive");
    try {
      await base44.entities.Membership.update(member.id, { status });
      invalidateTenantCache("Membership");
      await load();
    } catch (err) {
      setError(err?.message || "Não foi possível alterar a situação do membro.");
    }
  };

  const remove = async (member) => {
    if (member.user_id === user?.id) return;
    if (!window.confirm(`Remover ${member.user_name || member.user_email} da equipe?`)) return;
    setError("");
    try {
      await base44.entities.Membership.delete(member.id);
      invalidateTenantCache("Membership");
      await load();
    } catch (err) {
      setError(err?.message || "Não foi possível remover o membro.");
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={invite} className="surface p-5">
        <h2 className="font-heading font-bold text-[15px]">Convidar para a equipe</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Cada perfil define o que o usuário pode fazer dentro da empresa.
        </p>

        <div className="mt-4 grid sm:grid-cols-[1fr_1fr_180px_auto] gap-3 items-end">
          <div>
            <Label htmlFor="member-name" className="field-label">Nome</Label>
            <Input id="member-name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="member-email" className="field-label">E-mail</Label>
            <Input id="member-email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="mt-1.5" required />
          </div>
          <div>
            <Label className="field-label">Perfil</Label>
            <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
              <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMPANY_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={saving} className="gap-2 h-10">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Convidar
          </Button>
        </div>

        {message && <p className="mt-3 text-sm text-primary">{message}</p>}
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-4 rounded-xl bg-muted/60 p-3 text-[11px] text-muted-foreground space-y-1">
          {COMPANY_ROLES.map((role) => (
            <p key={role.value}><strong className="text-foreground/80">{role.label}:</strong> {role.hint}</p>
          ))}
        </div>
      </form>

      <div className="surface overflow-hidden">
        <h2 className="font-heading font-bold text-[15px] p-5 pb-3">Equipe ({members.length})</h2>
        {loading ? (
          <div className="py-12 grid place-items-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : members.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-muted-foreground">Nenhum usuário vinculado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-y border-border bg-muted/40">
                  <th className="font-semibold px-5 py-2.5">Usuário</th>
                  <th className="font-semibold px-5 py-2.5">Perfil</th>
                  <th className="font-semibold px-5 py-2.5">Situação</th>
                  <th className="px-2" />
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3">
                      <span className="font-medium">{member.user_name || member.user_email}</span>
                      <span className="block text-[11px] text-muted-foreground">{member.user_email}</span>
                    </td>
                    <td className="px-5 py-3">
                      <Select value={member.role} onValueChange={(value) => changeRole(member, value)}>
                        <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COMPANY_ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleStatus(member)}
                        className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ring-1 ring-inset ${
                          member.status === "active"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : member.status === "invited"
                            ? "bg-amber-50 text-amber-700 ring-amber-200"
                            : "bg-muted text-muted-foreground ring-border"
                        }`}
                      >
                        {member.status === "active" ? "Ativo" : member.status === "invited" ? "Convidado" : "Inativo"}
                      </button>
                    </td>
                    <td className="px-2 py-3 text-right">
                      {member.user_id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(member)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
