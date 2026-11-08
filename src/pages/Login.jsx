import React, { useState } from "react";
import { Link } from "react-router-dom";
import { loginWithMfa, continueMfa, loginWithGoogle } from "@/lib/authMfa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";

const INPUT_CLASS =
  "h-12 rounded-xl border-border/70 bg-muted/40 pl-10 pr-11 text-[13.5px] transition-all focus-visible:border-primary/40 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/15";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Post-login destination (e.g. the MCP OAuth consent page sends users here
  // with returnTo so the grant flow can resume). Same-origin paths only.
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await loginWithMfa(email, password);
      if (result.mfa_required) {
        await continueMfa(result, returnTo);
        return;
      }
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "E-mail ou senha inválidos");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try { await loginWithGoogle(returnTo); }
    catch (err) { setError(err.message || 'Não foi possível entrar com o Google'); }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Entrar na sua conta"
      subtitle="Acesse o painel da sua assistência técnica"
      panelTitle="Bem-vindo de volta ao seu painel"
      panelSubtitle="Retome suas ordens de serviço, orçamentos e lançamentos financeiros exatamente de onde parou."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Cadastrar minha empresa
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="mb-6 h-12 w-full rounded-xl border-border/80 bg-card text-[13.5px] font-semibold shadow-sm transition-all hover:border-border hover:bg-muted/50"
        onClick={handleGoogle}
      >
        <GoogleIcon className="mr-2.5 w-[18px] h-[18px]" />
        Continuar com Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/80" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">ou</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/[0.07] px-3.5 py-2.5 text-[12.5px] font-medium text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[12.5px] font-semibold text-foreground/80">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="voce@empresa.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT_CLASS}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-[12.5px] font-semibold text-foreground/80">Senha</Label>
            <Link to="/forgot-password" className="text-[11.5px] font-medium text-primary underline-offset-4 hover:underline">
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT_CLASS}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          className="cta-gradient h-12 w-full rounded-xl text-[13.5px] font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.99]"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        Ambiente seguro · dados isolados por empresa
      </p>
    </AuthLayout>
  );
}
