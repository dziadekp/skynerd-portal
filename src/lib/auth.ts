// Auth utilities — token management happens server-side via BFF cookies
// This module handles client-side auth state

import type { User, Account } from "./types";

const USER_STORAGE_KEY = "portal_user";
const ACCOUNT_STORAGE_KEY = "portal_account";

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null): void {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function getStoredAccount(): Account | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredAccount(account: Account | null): void {
  if (typeof window === "undefined") return;
  if (account) {
    localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(account));
  } else {
    localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  }
}

export function clearAuthState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(ACCOUNT_STORAGE_KEY);
}
