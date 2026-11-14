import { Navigate } from "react-router-dom";
import { useTenant } from "@/lib/TenantContext";
import { FullScreenLoading } from "@/components/RequireCompany";

export default function RequireRole({ allowedRoles = [], children }) {
  const { loading, role } = useTenant();

  if (loading) return <FullScreenLoading />;
  if (!allowedRoles.includes(role)) return <Navigate to="/" replace />;

  return children;
}
