import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { applyPasswordReset } from "@/lib/authFirebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetCode = searchParams.get("oobCode") || searchParams.get("code");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) return setError("As senhas não coincidem.");
    if (newPassword.length < 6) return setError("A senha precisa ter pelo menos 6 caracteres.");
    setLoading(true);
    try {
      await applyPasswordReset(resetCode, newPassword);
      setDone(true);
    } catch (err) {
      setError(err.message || "O link expirou ou já foi utilizado. Solicite outro.");
    } finally {
      setLoading(false);
    }
  };

  if (!resetCode) return <AuthLayout icon={AlertTriangle} title="Link inválido" subtitle="O link de redefinição está incompleto ou inválido" footer={<Link to="/forgot-password" className="text-primary font-medium hover:underline">Solicitar novo link</Link>}><p className="text-sm text-foreground text-center">Solicite um novo e-mail para redefinir sua senha.</p></AuthLayout>;
  if (done) return <AuthLayout icon={Lock} title="Senha alterada" subtitle="Sua senha foi redefinida com sucesso" footer={<Link to="/login" className="text-primary font-medium hover:underline">Ir para o login</Link>}><p className="text-sm text-center">Agora você já pode entrar com sua nova senha.</p></AuthLayout>;

  return <AuthLayout icon={Lock} title="Nova senha" subtitle="Digite sua nova senha abaixo">
    {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="password">Nova senha</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" /><Input id="password" type="password" autoComplete="new-password" autoFocus placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10 h-12" required /></div></div>
      <div className="space-y-2"><Label htmlFor="confirm">Confirmar senha</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" /><Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-12" required /></div></div>
      <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Redefinir senha"}</Button>
    </form>
  </AuthLayout>;
}
