import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { invalidateTenantCache, myCompanyId, paged } from "@/lib/tenant";
import { TenantContext } from "@/lib/tenantContextObject";

const EMPTY = { loading: true, company: null, account: null, membership: null };

export function TenantProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(EMPTY);

  const refresh = useCallback(async () => {
    const companyId = myCompanyId(user);
    if (!user || !companyId) {
      setState({ loading: false, company: null, account: null, membership: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
    try {
      invalidateTenantCache("Company", "CompanyAccount", "Membership");
      const [companies, accounts, memberships] = await Promise.all([
        paged("Company", { id: companyId }),
        paged("CompanyAccount", { company_id: companyId }),
        paged("Membership", { company_id: companyId }),
      ]);
      const membership =
        memberships.find((m) => m.user_id === user.id) ||
        memberships.find((m) => (m.user_email || "").toLowerCase() === (user.email || "").toLowerCase()) ||
        null;
      setState({
        loading: false,
        company: companies[0] || null,
        account: accounts[0] || null,
        membership,
      });
    } catch (error) {
      console.error("Falha ao carregar a empresa", error);
      setState({ loading: false, company: null, account: null, membership: null });
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const role = state.membership?.role || (user?.role === "admin" ? "admin" : null);

  const value = useMemo(
    () => ({
      ...state,
      user,
      role,
      isPlatformAdmin: user?.role === "admin",
      can: {
        manageTeam: role === "admin",
        finance: role === "admin",
        editRecords: role === "admin" || role === "attendant",
        changeStatus: role === "admin" || role === "technician",
      },
      refresh,
    }),
    [state, user, role, refresh]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error("useTenant precisa estar dentro de TenantProvider");
  return context;
}
