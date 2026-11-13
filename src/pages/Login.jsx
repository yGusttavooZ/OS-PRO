import React, { useState } from "react";
import { Link } from "react-router-dom";
import { loginWithEmail, loginWithGoogle } from "@/lib/authFirebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, LockKeyhole, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";

const INPUT_CLASS = "h-12 rounded-xl border-border/70 bg-muted/40 pl-10 pr-11 text-[13.5px] transition-all focus-visible:border-primary/40 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/15";

export default function Login() {
  const [email, setEmail] = useState(() => new URLSearchParams(window.location.search).get("email")?.trim() || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      window.location.assign(returnTo);
    } catch (err) {
      setError(err.code === "auth/invalid-credential" ? "E-mail ou senha inválidos." : err.message || "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await loginWithGoogle();
      window.location.assign(returnTo);
    } catch (err) {
      setError(err.message || "Não foi possível entrar com o Google.");
    }
  };

  return (
    <AuthLayout
      cardTitle={undefined}
      panelTitle="Bem-vindo de volta ao seu painel"
      panelSubtitle="Retome suas ordens de serviço, orçamentos e lançamentos financeiros exatamente de onde parou."
      footer={<>Ainda não tem conta? <Link to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")} className="font-semibold text-primary underline-offset-4 hover:underline">Cadastrar minha empresa</Link></>}
    >
      <div className="mb-5">
        <div className="flex items-center gap-3.5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/15 via-primary/[0.08] to-chart-3/10 text-primary shadow-inner shadow-primary/10">
            <LockKeyhole className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <h1 className="font-heading text-[22px] font-extrabold tracking-[-0.03em] text-foreground sm:text-[24px]">Bem-vindo de volta</h1>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">Acesse sua conta para continuar.</p>
          </div>
        </div>
        <div className="mt-5 h-px bg-gradient-to-r from-primary/25 via-border to-transparent" />
      </div>
      {error && <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/[0.07] px-3.5 py-2.5 text-[12.5px] font-medium text-destructive">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="email" className="text-[12.5px] font-semibold text-foreground/80">E-mail</Label><div className="relative"><Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="email" type="email" autoComplete="email" autoFocus placeholder="voce@empresa.com.br" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT_CLASS} required /></div></div>
        <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password" className="text-[12.5px] font-semibold text-foreground/80">Senha</Label><Link to="/forgot-password" className="text-[11.5px] font-medium text-primary underline-offset-4 hover:underline">Esqueci minha senha</Link></div><div className="relative"><Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={INPUT_CLASS} required /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
        <Button type="submit" className="cta-gradient h-12 w-full rounded-xl text-[13.5px] font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.99]" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</> : "Entrar"}</Button>
      </form>
      <div className="relative my-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/80" /></div><div className="relative flex justify-center"><span className="bg-card px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">ou</span></div></div>
      <Button variant="outline" className="h-12 w-full rounded-xl border-border/80 bg-card text-[13.5px] font-semibold shadow-sm transition-all hover:border-border hover:bg-muted/50" onClick={handleGoogle}>
        <GoogleIcon className="mr-2.5 w-[18px] h-[18px]" /> Continuar com Google
      </Button>
      <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-primary" />Ambiente seguro · dados isolados por empresa</p>
    </AuthLayout>
  );
}
