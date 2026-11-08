import { Navigate } from "react-router-dom";
import { useTenant } from "@/lib/TenantContext";
import { FullScreenLoading } from "@/components/RequireCompany";

export default function PlatformGuard({ children }) {
  const { loading, isPlatformAdmin } = useTenant();

  if (loading) return <FullScreenLoading label="Carregando painel da plataforma..." />;
  if (!isPlatformAdmin) return <Navigate to="/" replace />;

  return children;
}
