"use client";

import { useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { isAuthenticatedAtom } from "../stores/auth-atoms";

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const hasMounted = useSyncExternalStore(
    emptySubscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const router = useRouter();

  useEffect(() => {
    if (hasMounted && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hasMounted, isAuthenticated, router]);

  if (!hasMounted || !isAuthenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-neutral-100">
        <div className="text-sm text-neutral-400">Loading…</div>
      </div>
    );
  }

  return <>{children}</>;
}
