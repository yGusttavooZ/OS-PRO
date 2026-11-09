import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { loadTenantProfile } from "@/lib/firestoreTenant";
import { TenantContext } from "@/lib/tenantContextObject";

const EMPTY = { loading: true, company: null, account: null, membership: null, userProfile: null };

export function TenantProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(EMPTY);

  const refresh = useCallback(async () => {
    if (!user?.uid) {
      setState({ ...EMPTY, loading: false });
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const data = await loadTenantProfile(user);
      setState({ loading: false, ...data });
    } catch (error) {
      console.error("Falha ao carregar o ambiente da empresa", error);
      setState({ ...EMPTY, loading: false });
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const role = state.membership?.role || state.userProfile?.company_role || null;
  const value = useMemo(() => ({
    ...state,
    user,
    role,
    isPlatformAdmin: state.userProfile?.platform_role === "platform_admin",
    can: {
      manageTeam: role === "admin",
      finance: role === "admin",
      editRecords: role === "admin" || role === "attendant",
      changeStatus: role === "admin" || role === "technician",
    },
    refresh,
  }), [state, user, role, refresh]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error("useTenant precisa estar dentro de TenantProvider");
  return context;
}
