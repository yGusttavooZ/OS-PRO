import { useEffect, useState } from "react";
import { Loader2, UserPlus, Trash2, Copy, Users, Mail, ShieldCheck, UserRound, CircleCheck, Clock3, Ban } from "lucide-react";
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
      setMessage("Convite registrado. Copie o link na lista de convidados e envie ao funcionário. O sistema ainda não envia e-mails automaticamente.");
      invalidateTenantCache("Membership");
      load();
    } catch (err) {
      setError(err?.message || "Não foi possível convidar.");
    } finally {
      setSaving(false);
    }
  };

  const copyInviteLink = async (member) => {
    const link = `${window.location.origin}/register/employee?email=${encodeURIComponent((member.user_email || "").trim().toLowerCase())}`;
    try {
      await navigator.clipboard.writeText(link);
      setMessage(`Link de acesso copiado para ${member.user_email}. Envie-o ao funcionário.`);
      setError("");
    } catch {
      setError("Não foi possível copiar o link. Verifique a permissão de área de transferência do navegador.");
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

  const activeCount = members.filter((member) => member.status === "active").length;
  const invitedCount = members.filter((member) => member.status === "invited").length;

  return (
    <div className="space-y-5">
      <form onSubmit={invite} className="surface overflow-hidden">
        <div className="flex items-start gap-3 border-b border-border/70 px-5 py-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <UserPlus className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-heading text-[15px] font-bold">Adicionar à equipe</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Convide um funcionário e escolha quais áreas ele poderá acessar.
            </p>
          </div>
        </div>

        <div className="grid gap-4 p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="min-w-0">
              <Label htmlFor="member-name" className="field-label">Nome do funcionário</Label>
              <Input id="member-name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ex.: João da Silva" className="mt-1.5 h-10" />
            </div>
            <div className="min-w-0">
              <Label htmlFor="member-email" className="field-label">E-mail de acesso</Label>
              <Input id="member-email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="funcionario@email.com" className="mt-1.5 h-10" required />
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-xs">
              <Label className="field-label">Perfil de acesso</Label>
              <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
                <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMPANY_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={saving} className="h-10 gap-2 sm:min-w-36">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Enviar convite
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {COMPANY_ROLES.map((role) => (
              <div key={role.value} className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  {role.label}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{role.hint}</p>
              </div>
            ))}
          </div>
          {message && <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-primary">{message}</p>}
          {error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">{error}</p>}
        </div>
      </form>

      <section className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-heading text-[15px] font-bold">Membros da equipe</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Gerencie os acessos vinculados à empresa.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-700"><CircleCheck className="h-3.5 w-3.5" /> {activeCount} ativos</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 font-medium text-amber-700"><Clock3 className="h-3.5 w-3.5" /> {invitedCount} convidados</span>
            <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">{members.length} no total</span>
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-14 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : members.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-muted text-muted-foreground"><Users className="h-5 w-5" /></span>
            <p className="mt-3 text-sm font-semibold">Sua equipe ainda está vazia</p>
            <p className="mt-1 text-xs text-muted-foreground">Use o formulário acima para convidar o primeiro funcionário.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {members.map((member) => (
              <article key={member.id} className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-muted/20 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{member.user_name || member.user_email}</p>
                    <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{member.user_email}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[390px] lg:shrink-0">
                  <div className="min-w-0">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Perfil</p>
                    <Select value={member.role} onValueChange={(value) => changeRole(member, value)}>
                      <SelectTrigger disabled={member.user_id === user?.id} className="h-9 w-full text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COMPANY_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Situação</p>
                    <div className="flex min-h-9 flex-wrap items-center gap-2">
                      <button
                        disabled={member.user_id === user?.id}
                        onClick={() => toggleStatus(member)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition-opacity disabled:cursor-not-allowed disabled:opacity-60 ${
                          member.status === "active"
                            ? "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20"
                            : member.status === "invited"
                            ? "bg-amber-500/10 text-amber-700 ring-amber-600/20"
                            : "bg-muted text-muted-foreground ring-border"
                        }`}
                      >
                        {member.status === "active" ? <CircleCheck className="h-3.5 w-3.5" /> : member.status === "invited" ? <Clock3 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                        {member.status === "active" ? "Ativo" : member.status === "invited" ? "Convidado" : "Inativo"}
                      </button>
                      {member.status === "invited" && (
                        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg px-2.5 text-xs" onClick={() => copyInviteLink(member)}>
                          <Copy className="h-3.5 w-3.5" /> Copiar link
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {member.user_id !== user?.id && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 self-end text-muted-foreground hover:bg-destructive/10 hover:text-destructive lg:self-center" onClick={() => remove(member)} title="Remover membro">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </article>
            ))}
          </div>
        )}
        {message && <p className="mx-5 mb-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-primary">{message}</p>}
        {error && <p role="alert" className="mx-5 mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">{error}</p>}
      </section>
    </div>
  );
}
