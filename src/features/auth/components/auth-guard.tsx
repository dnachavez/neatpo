"use client";

import { useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAuthenticatedAtom } from "../stores/auth-atoms";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-neutral-100">
        <div className="text-sm text-neutral-400">Loading…</div>
      </div>
    );
  }

  return <>{children}</>;
}
