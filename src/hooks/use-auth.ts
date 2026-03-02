"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import type { User, Account } from "@/lib/types";
import {
  getStoredUser,
  setStoredUser,
  getStoredAccount,
  setStoredAccount,
  clearAuthState,
} from "@/lib/auth";

interface AuthContextValue {
  user: User | null;
  account: Account | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ accounts: Account[]; requires_account_selection: boolean } | null>;
  logout: () => Promise<void>;
  selectAccount: (account: Account) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthProvider(): AuthContextValue {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load stored state on mount
  useEffect(() => {
    const storedUser = getStoredUser();
    const storedAccount = getStoredAccount();
    if (storedUser) setUser(storedUser);
    if (storedAccount) setAccount(storedAccount);
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.error || data[0] || "Login failed");
      }

      setUser(data.user);
      setStoredUser(data.user);

      // If single account, auto-select it
      if (!data.requires_account_selection && data.accounts?.length === 1) {
        const acc = data.accounts[0];
        setAccount(acc);
        setStoredAccount(acc);
        await selectAccountOnServer(acc.id);
      }

      return {
        accounts: data.accounts,
        requires_account_selection: data.requires_account_selection,
      };
    },
    []
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    setAccount(null);
    clearAuthState();
    router.push("/login");
  }, [router]);

  const selectAccount = useCallback(async (acc: Account) => {
    const success = await selectAccountOnServer(acc.id);
    if (success) {
      setAccount(acc);
      setStoredAccount(acc);
    }
    return success;
  }, []);

  return { user, account, isLoading, login, logout, selectAccount };
}

async function selectAccountOnServer(accountId: string): Promise<boolean> {
  const res = await fetch("/api/portal/accounts/select", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ account_id: accountId }),
  });
  return res.ok;
}

export { AuthContext };

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
