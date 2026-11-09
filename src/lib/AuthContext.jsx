import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const AuthContext = createContext(null);

function toAppUser(firebaseUser) {
  if (!firebaseUser) return null;
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    full_name: firebaseUser.displayName || "",
    photo_url: firebaseUser.photoURL || "",
    email_verified: firebaseUser.emailVerified,
    company_id: null,
    company_name: "",
    company_role: null,
    role: null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  const checkUserAuth = useCallback(async () => {
    const current = auth.currentUser;
    if (current && !current.emailVerified && current.providerData.some((p) => p.providerId === "password")) {
      await signOut(auth);
      setUser(null);
      setAuthError({ type: "email_not_verified", message: "Confirme seu e-mail para acessar o sistema." });
      return;
    }
    setUser(toAppUser(current));
    setAuthError(null);
  }, []);

  const checkAppState = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      await auth.currentUser?.reload();
      await checkUserAuth();
    } catch (error) {
      setAuthError({ type: "unknown", message: error.message || "Não foi possível verificar sua sessão." });
      setUser(null);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, [checkUserAuth]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser && !firebaseUser.emailVerified && firebaseUser.providerData.some((p) => p.providerId === "password")) {
          await signOut(auth);
          setUser(null);
          setAuthError({ type: "email_not_verified", message: "Confirme seu e-mail para acessar o sistema." });
        } else {
          setUser(toAppUser(firebaseUser));
          setAuthError(null);
        }
      } catch (error) {
        setUser(null);
        setAuthError({ type: "unknown", message: error.message });
      } finally {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    });
    return unsubscribe;
  }, []);

  const logout = useCallback(async (shouldRedirect = true) => {
    await signOut(auth);
    setUser(null);
    if (shouldRedirect) window.location.assign("/login");
  }, []);

  const navigateToLogin = useCallback(() => {
    window.location.assign("/login");
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoadingAuth,
    isLoadingPublicSettings: false,
    authError,
    appPublicSettings: null,
    authChecked,
    logout,
    navigateToLogin,
    checkUserAuth,
    checkAppState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
