import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useTenant } from "@/lib/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crown, Loader2, ShieldCheck, MailCheck } from "lucide-react";

export default function OwnerSetup() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isPlatformAdmin, refresh } = useTenant();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const registerOwnerLogin = async (event) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.");
    if (password !== confirmPassword) return setError("As senhas não coincidem.");
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await updateProfile(credential.user, { displayName: fullName.trim() });
      await sendEmailVerification(credential.user, {
        url: `${window.location.origin}/login?returnTo=%2Fconfigurar-proprietario`,
        handleCodeInApp: false,
      });
      await signOut(auth);
      setEmailSent(true);
    } catch (err) {
      setError(err.code === "auth/email-already-in-use"
        ? "Este e-mail já possui uma conta. Entre com ela para continuar."
        : err.message || "Não foi possível criar o acesso.");
    } finally {
      setLoading(false);
    }
  };

  const activateOwner = async () => {
    setError("");
    if (!auth.currentUser) {
      setError("Sua sessão expirou. Entre novamente para continuar.");
      return;
    }
    if (!auth.currentUser.emailVerified) {
      setError("Confirme o endereço de e-mail antes de ativar o acesso do proprietário.");
      return;
    }
    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken(true);
      const response = await fetch("/api/bootstrap-owner", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Não foi possível ativar o proprietário.");
      await refresh();
      navigate("/plataforma", { replace: true });
    } catch (err) {
      setError(err.message || "Falha ao configurar o proprietário.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[80vh] max-w-lg items-center">
        <section className="w-full rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl sm:p-8">
          <div className="mb-7 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400/15 text-amber-300">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">OS-PRO</p>
              <h1 className="text-2xl font-bold">Acesso do proprietário</h1>
            </div>
          </div>

          {isPlatformAdmin ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                <ShieldCheck className="mb-2 h-5 w-5" />
                O acesso de proprietário já está ativo nesta conta.
              </div>
              <Button className="w-full" onClick={() => navigate("/plataforma")}>Acessar plataforma</Button>
            </div>
          ) : user ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">Conta conectada: <strong className="text-white">{user.email}</strong></p>
              {!user.email_verified && (
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
                  Confirme o e-mail desta conta antes de continuar. Depois, entre novamente.
                </div>
              )}
              {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
              <Button className="w-full" onClick={activateOwner} disabled={loading || !user.email_verified}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Ativar acesso do proprietário
              </Button>
              <button type="button" onClick={() => logout(true)} className="w-full text-sm text-slate-400 hover:text-white">Sair desta conta</button>
            </div>
          ) : emailSent ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                <MailCheck className="mb-2 h-5 w-5" />
                Enviamos um link de confirmação para <strong>{email}</strong>. Confirme o e-mail e depois entre para ativar o acesso do proprietário.
              </div>
              <Link to="/login?returnTo=%2Fconfigurar-proprietario">
                <Button className="w-full">Ir para o login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={registerOwnerLogin} className="space-y-4">
              <p className="mb-5 text-sm leading-relaxed text-slate-300">
                Crie seu acesso individual. A permissão de proprietário será concedida pelo servidor somente à conta autorizada para a configuração inicial.
              </p>
              <div className="space-y-2">
                <Label htmlFor="owner-name" className="text-slate-200">Nome completo</Label>
                <Input id="owner-name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-email" className="text-slate-200">E-mail</Label>
                <Input id="owner-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-password" className="text-slate-200">Senha</Label>
                <Input id="owner-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-confirm" className="text-slate-200">Confirmar senha</Label>
                <Input id="owner-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
              </div>
              {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crown className="mr-2 h-4 w-4" />}
                Criar acesso inicial
              </Button>
            </form>
          )}

          <div className="mt-6 border-t border-white/10 pt-5 text-center text-sm text-slate-400">
            Já possui uma conta? <Link className="font-semibold text-white hover:underline" to="/login?returnTo=%2Fconfigurar-proprietario">Entrar</Link>
            <span className="mx-2">·</span>
            <Link className="font-semibold text-white hover:underline" to="/">Voltar</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
