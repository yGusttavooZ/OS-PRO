import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { continueMfa, loginWithGoogle } from "@/lib/authMfa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";

const INPUT_CLASS =
  "h-12 rounded-xl border-border/70 bg-muted/40 pl-10 pr-11 text-[13.5px] transition-all focus-visible:border-primary/40 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/15";

const PRIMARY_BUTTON =
  "cta-gradient h-12 w-full rounded-xl text-[13.5px] font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.99]";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const loginPath = "/login" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Não foi possível criar a conta");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.mfa_required) {
        // The account is already verified, so a retry here would fail; sign in again instead.
        await continueMfa(result, safeReturnTo()).catch(() => window.location.assign(loginPath));
        return;
      }
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err.message || "Código de verificação inválido");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({
        title: "Código reenviado",
        description: "Confira seu e-mail para o novo código.",
      });
    } catch (err) {
      setError(err.message || "Não foi possível reenviar o código");
    }
  };

  const handleGoogle = async () => {
    try { await loginWithGoogle(safeReturnTo()); }
    catch (err) { setError(err.message || 'Não foi possível cadastrar com o Google'); }
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Confirme seu e-mail"
        subtitle={`Enviamos um código de 6 dígitos para ${email}`}
      >
        {error && (
          <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/[0.07] px-3.5 py-2.5 text-[12.5px] font-medium text-destructive">
            {error}
          </div>
        )}
        <div className="mb-6 flex justify-center">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className={PRIMARY_BUTTON}
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            "Verificar e continuar"
          )}
        </Button>
        <p className="mt-4 text-center text-[12.5px] text-muted-foreground">
          Não recebeu o código?{" "}
          <button onClick={handleResend} className="font-semibold text-primary underline-offset-4 hover:underline">
            Reenviar
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Building2}
      title="Cadastre sua empresa"
      subtitle="Crie sua conta e configure os dados iniciais da assistência técnica"
      panelTitle="Comece a usar o OS PRO em poucos minutos"
      panelSubtitle="Crie a conta da sua empresa, informe os dados que aparecem nos documentos e comece no período de teste de 14 dias."
      footer={
        <>
          Já tem uma conta?{" "}
          <Link to={loginPath} className="font-semibold text-primary underline-offset-4 hover:underline">
            Entrar
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
          <Label htmlFor="email" className="text-[12.5px] font-semibold text-foreground/80">E-mail de acesso</Label>
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
          <Label htmlFor="password" className="text-[12.5px] font-semibold text-foreground/80">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
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
        <div className="space-y-2">
          <Label htmlFor="confirm" className="text-[12.5px] font-semibold text-foreground/80">Confirmar senha</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>
        <Button type="submit" className={PRIMARY_BUTTON} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando conta...
            </>
          ) : (
            "Criar conta e cadastrar empresa"
          )}
        </Button>
      </form>

      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/40 px-3.5 py-3">
        <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-primary" />
        <p className="text-[11.5px] leading-relaxed text-muted-foreground">
          Depois de confirmar o e-mail você informa os dados da empresa e entra direto no sistema.
        </p>
      </div>
    </AuthLayout>
  );
}
