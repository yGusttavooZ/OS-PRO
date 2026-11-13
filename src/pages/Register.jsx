import React, { useState } from "react";
import { Link } from "react-router-dom";
import { registerWithEmail, loginWithGoogle } from "@/lib/authFirebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck, MailCheck, UserRoundPlus } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";

const INPUT_CLASS = "h-12 rounded-xl border-border/70 bg-muted/40 pl-10 pr-11 text-[13.5px] transition-all focus-visible:border-primary/40 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/15";
const PRIMARY_BUTTON = "cta-gradient h-12 w-full rounded-xl text-[13.5px] font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.99]";

export default function Register() {
  const employeeInvite = window.location.pathname === "/register/employee";
  const invitedEmail = new URLSearchParams(window.location.search).get("email")?.trim().toLowerCase() || "";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const loginPath = employeeInvite ? `/login?returnTo=%2Fonboarding&email=${encodeURIComponent(invitedEmail)}` : "/login" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (employeeInvite && !invitedEmail) return setError("Este link de convite está incompleto. Peça ao administrador para compartilhar um novo link.");
    if (employeeInvite && email.trim().toLowerCase() !== invitedEmail) return setError("Use o mesmo e-mail para o qual o convite foi enviado.");
    if (password !== confirmPassword) return setError("As senhas não coincidem.");
    if (password.length < 6) return setError("A senha precisa ter pelo menos 6 caracteres.");
    setLoading(true);
    try {
      await registerWithEmail(fullName, email, password);
      setEmailSent(true);
    } catch (err) {
      setError(err.code === "auth/email-already-in-use" ? "Este e-mail já possui uma conta." : err.message || "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try { await loginWithGoogle(); window.location.assign(safeReturnTo()); }
    catch (err) { setError(err.message || "Não foi possível cadastrar com o Google."); }
  };

  if (employeeInvite && !invitedEmail) {
    return <AuthLayout icon={UserRoundPlus} title="Link de convite inválido" subtitle="Peça ao administrador da empresa para compartilhar novamente o convite.">
      <Link to="/login"><Button className={PRIMARY_BUTTON}>Ir para o login</Button></Link>
    </AuthLayout>;
  }

  if (emailSent) {
    return <AuthLayout icon={MailCheck} title="Confirme seu e-mail" subtitle={`Enviamos um link de confirmação para ${email}`}>
      <div className="rounded-xl border border-border/70 bg-muted/40 px-4 py-4 text-sm text-muted-foreground">
        Abra o e-mail enviado pelo Firebase e clique em **Confirmar endereço de e-mail**. Depois, volte para esta página e entre na sua conta.
      </div>
      <Link to={loginPath} className="mt-5 block"><Button className={PRIMARY_BUTTON}>Ir para o login</Button></Link>
      <p className="mt-4 text-center text-xs text-muted-foreground">Não encontrou? Verifique também a pasta de spam.</p>
    </AuthLayout>;
  }

  return <AuthLayout compact={!employeeInvite} icon={employeeInvite ? UserRoundPlus : Building2} title={employeeInvite ? "Criar acesso de funcionário" : "Cadastre sua empresa"} subtitle={employeeInvite ? "Crie sua conta para entrar na empresa que enviou o convite." : "Crie sua conta e configure os dados iniciais da assistência técnica"} panelTitle={employeeInvite ? "Seu acesso à equipe começa aqui" : "Comece a usar o OS PRO em poucos minutos"} panelSubtitle={employeeInvite ? "Crie seu acesso individual. Após confirmar o e-mail, você poderá aceitar o convite e entrar na empresa." : "Crie a conta da sua empresa, informe os dados que aparecem nos documentos e comece no período de teste de 14 dias."} footer={<>Já tem uma conta? <Link to={loginPath} className="font-semibold text-primary underline-offset-4 hover:underline">Entrar</Link></>}>
    {!employeeInvite && <>
      <Button variant="outline" className="mb-4 h-12 w-full rounded-xl border-border/80 bg-card text-[13.5px] font-semibold shadow-sm transition-all hover:border-border hover:bg-muted/50" onClick={handleGoogle}><GoogleIcon className="mr-2.5 w-[18px] h-[18px]" /> Continuar com Google</Button>
      <div className="relative mb-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/80" /></div><div className="relative flex justify-center"><span className="bg-card px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">ou</span></div></div>
    </>}
    {error && <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/[0.07] px-3.5 py-2.5 text-[12.5px] font-medium text-destructive">{error}{employeeInvite && error === "Este e-mail já possui uma conta." && <Link to={loginPath} className="mt-2 block font-semibold underline">Entrar com a conta existente</Link>}</div>}
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5"><Label htmlFor="fullName" className="text-[12.5px] font-semibold text-foreground/80">Nome completo</Label><div className="relative"><Input id="fullName" type="text" autoComplete="name" placeholder="Seu nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} className={INPUT_CLASS.replace("pl-10", "pl-4")} required /></div></div>
      <div className="space-y-1.5"><Label htmlFor="email" className="text-[12.5px] font-semibold text-foreground/80">E-mail de acesso</Label><div className="relative"><Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="email" type="email" autoComplete="email" autoFocus placeholder="voce@empresa.com.br" value={email} onChange={(e) => setEmail(e.target.value)} readOnly={employeeInvite} className={INPUT_CLASS} required /></div></div>
      <div className="space-y-1.5"><Label htmlFor="password" className="text-[12.5px] font-semibold text-foreground/80">Senha</Label><div className="relative"><Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={INPUT_CLASS} required /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
      <div className="space-y-1.5"><Label htmlFor="confirm" className="text-[12.5px] font-semibold text-foreground/80">Confirmar senha</Label><div className="relative"><Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="confirm" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={INPUT_CLASS} required /></div></div>
      <Button type="submit" className={PRIMARY_BUTTON} disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando conta...</> : employeeInvite ? "Criar meu acesso" : "Criar conta e cadastrar empresa"}</Button>
    </form>
    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/[0.045] to-chart-3/[0.04] px-4 py-3.5 shadow-sm"><ShieldCheck className="mt-px h-4 w-4 shrink-0 text-primary" /><p className="text-[11.5px] leading-relaxed text-muted-foreground">{employeeInvite ? "Depois de confirmar o e-mail, entre com esta conta para aceitar o convite. Você não precisa cadastrar uma empresa." : "Depois de confirmar o e-mail você informa os dados da empresa e entra direto no sistema."}</p></div>
  </AuthLayout>;
}
