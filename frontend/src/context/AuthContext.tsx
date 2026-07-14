"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiFetch, setAccessToken, refreshAccessToken } from "@/lib/apiClient";
import { User, UserRole } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On first app load, there's no access token in memory (page refresh wipes it).
  // Try the refresh cookie silently to restore the session without a login screen flash.
  useEffect(() => {
    (async () => {
      const token = await refreshAccessToken();
      if (token) {
        try {
          const data = await apiFetch<{ user: User }>("/auth/me");
          setUser(data.user);
        } catch {
          setAccessToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  async function login(email: string, password: string) {
    const data = await apiFetch<{ accessToken: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }

  async function register(name: string, email: string, password: string, role: UserRole) {
    const data = await apiFetch<{ accessToken: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
      skipAuth: true,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" });
    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
