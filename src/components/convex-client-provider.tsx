"use client";

import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

const convex = CONVEX_URL ? new ConvexReactClient(CONVEX_URL) : null;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return <>{children}</>;
  }
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
