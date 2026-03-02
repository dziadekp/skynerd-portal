"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useAccounts } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Account } from "@/lib/types";

export default function SelectAccountPage() {
  const { selectAccount } = useAuth();
  const { data: accounts, isLoading } = useAccounts();
  const router = useRouter();

  async function handleSelect(account: Account) {
    const success = await selectAccount(account);
    if (success) {
      router.push("/dashboard");
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Select an Account</h1>
        <p className="mt-1 text-muted-foreground">
          Choose which account you'd like to view
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {accounts?.map((account) => (
            <Card
              key={account.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 hover:scale-[1.02]"
              onClick={() => handleSelect(account)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{account.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground capitalize">
                  {account.type}
                </p>
                {account.role && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Role: {account.role}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
