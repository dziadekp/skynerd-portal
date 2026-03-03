"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setStoredUser, setStoredAccount } from "@/lib/auth";

function AutoLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("No token provided.");
      return;
    }

    async function exchange() {
      try {
        const res = await fetch("/api/auth/auto-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Auto-login failed.");
          return;
        }

        // Store user in localStorage for the auth hook
        setStoredUser(data.user);
        if (data.accounts?.length === 1) {
          setStoredAccount(data.accounts[0]);
        }

        router.replace("/dashboard");
      } catch {
        setError("Failed to connect to server.");
      }
    }

    exchange();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="text-center">
        <p className="text-sm text-red-500 mb-4">{error}</p>
        <a href="/login" className="text-sm text-primary underline">
          Go to login
        </a>
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">Signing in...</p>;
}

export default function AutoLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Signing in...</p>}>
        <AutoLoginContent />
      </Suspense>
    </div>
  );
}
