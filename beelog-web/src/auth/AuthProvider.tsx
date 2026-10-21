import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export type AuthStatus = "checking" | "unconfigured" | "anonymous" | "non-admin" | "admin";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  error: string;
  busy: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const configurationMessage = "Supabase is not configured. BeeLog is running with mock public data in read-only demo mode.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = supabase;
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? "checking" : "unconfigured");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const verificationId = useRef(0);

  const verifyAdmin = useCallback(async (session: Session | null): Promise<boolean> => {
    const attempt = ++verificationId.current;
    if (!session || !client) {
      setUser(null);
      setStatus(client ? "anonymous" : "unconfigured");
      setError("");
      return false;
    }

    setUser(session.user);
    setStatus("checking");
    const { data, error: membershipError } = await client
      .from("admin_users")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (attempt !== verificationId.current) return false;
    if (membershipError) {
      setStatus("non-admin");
      setError("Administrator access could not be verified. BeeLog remains in public read-only mode.");
      return false;
    }

    const isAdmin = Boolean(data);
    setStatus(isAdmin ? "admin" : "non-admin");
    if (!isAdmin) setError("This account is not authorized to administer BeeLog. Public browsing remains available.");
    else setError("");
    return isAdmin;
  }, [client]);

  useEffect(() => {
    if (!client) {
      setStatus("unconfigured");
      return;
    }

    let active = true;
    const subscription = client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (active) void verifyAdmin(session);
      }, 0);
    }).data.subscription;

    const restoreSession = async () => {
      const { data, error: sessionError } = await client.auth.getSession();
      if (!active) return;
      if (sessionError) {
        setUser(null);
        setStatus("anonymous");
        setError("Your session could not be restored. Please log in again.");
        return;
      }
      await verifyAdmin(data.session);
    };

    const recheckSession = async () => {
      const { data, error: sessionError } = await client.auth.getSession();
      if (!active) return;
      if (sessionError) {
        setUser(null);
        setStatus("anonymous");
        setError("Your session could not be verified. Public read-only mode remains enabled.");
        return;
      }
      await verifyAdmin(data.session);
    };

    void restoreSession();
    window.addEventListener("focus", recheckSession);
    const authorizationRecheck = window.setInterval(recheckSession, 60_000);

    return () => {
      active = false;
      verificationId.current += 1;
      window.clearInterval(authorizationRecheck);
      window.removeEventListener("focus", recheckSession);
      subscription.unsubscribe();
    };
  }, [client, verifyAdmin]);

  const login = useCallback(async (email: string, password: string) => {
    if (!client) {
      setError(configurationMessage);
      return false;
    }

    setBusy(true);
    setError("");
    try {
      const { data, error: signInError } = await client.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return false;
      }
      if (!data.session) {
        setError("Supabase did not return a valid session. Please try again.");
        return false;
      }
      return await verifyAdmin(data.session);
    } catch {
      setError("Login could not be completed. Check your connection and try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [client, verifyAdmin]);

  const logout = useCallback(async () => {
    if (!client) return;
    setBusy(true);
    setError("");
    try {
      const { error: signOutError } = await client.auth.signOut();
      if (signOutError) setError(signOutError.message);
      else {
        setUser(null);
        setStatus("anonymous");
      }
    } finally {
      setBusy(false);
    }
  }, [client]);

  const clearError = useCallback(() => setError(""), []);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user,
    error,
    busy,
    login,
    logout,
    clearError,
  }), [status, user, error, busy, login, logout, clearError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAdminAuth must be used within AuthProvider");
  return value;
}
