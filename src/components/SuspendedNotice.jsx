import { AlertOctagon, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function SuspendedNotice({ company }) {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="surface max-w-md w-full p-8 text-center">
        <span className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive grid place-items-center mx-auto">
          <AlertOctagon className="w-6 h-6" />
        </span>
        <h1 className="mt-5 font-heading font-extrabold text-xl">Conta suspensa</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O acesso da empresa <strong className="text-foreground">{company?.name}</strong> está temporariamente
          bloqueado. Regularize a assinatura para voltar a emitir ordens de serviço.
        </p>
        <button
          onClick={() => logout(true)}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <LogOut className="w-4 h-4" /> Sair da conta
        </button>
      </div>
    </div>
  );
}
