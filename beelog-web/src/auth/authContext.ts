import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";

export type AuthStatus = "checking" | "unconfigured" | "anonymous" | "non-admin" | "admin";

export type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  error: string;
  busy: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAdminAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAdminAuth must be used within AuthProvider");
  return value;
}
