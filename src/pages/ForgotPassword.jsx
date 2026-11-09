import React, { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "@/lib/authFirebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Não foi possível enviar o link.");
    } finally {
      setLoading(false);
    }
  };

  return <AuthLayout icon={Mail} title="Recuperar senha" subtitle="Enviaremos um link para redefinir sua senha" footer={<Link to="/login" className="text-primary font-medium hover:underline"><ArrowLeft className="w-3 h-3 inline mr-1" />Voltar ao login</Link>}>
    {sent ? <p className="text-sm text-foreground text-center">Se houver uma conta vinculada a esse e-mail, você receberá um link para redefinir a senha.</p> : <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2"><Label htmlFor="email">E-mail</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" /><Input id="email" type="email" autoComplete="email" autoFocus placeholder="voce@empresa.com.br" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required /></div></div>
      <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</> : "Enviar link de recuperação"}</Button>
    </form>}
  </AuthLayout>;
}
