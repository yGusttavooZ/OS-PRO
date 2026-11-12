import { Navigate } from "react-router-dom";
import { Loader2, ShieldOff, LogOut } from "lucide-react";
import { useTenant } from "@/lib/TenantContext";
import { useAuth } from "@/lib/AuthContext";
import SuspendedNotice from "@/components/SuspendedNotice";

export function FullScreenLoading({ label = "Carregando seu ambiente..." }) {
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm">{label}</p>
      </div>
    </div>
  );
}

export function AccessRevoked() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="surface max-w-md w-full p-8 text-center">
        <span className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground grid place-items-center mx-auto">
          <ShieldOff className="w-6 h-6" />
        </span>
        <h1 className="mt-5 font-heading font-extrabold text-xl">Acesso não liberado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu usuário não possui um perfil ativo nesta empresa. Peça ao administrador para liberar o acesso.
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

export default function RequireCompany({ children }) {
  const { loading, company, account, membership, accessRevoked } = useTenant();

  if (loading) return <FullScreenLoading />;
  if (accessRevoked) return <AccessRevoked />;
  if (!company) return <Navigate to="/onboarding" replace />;
  if (account?.status === "suspended") return <SuspendedNotice company={company} />;
  if (!membership) return <AccessRevoked />;

  return children;
}
