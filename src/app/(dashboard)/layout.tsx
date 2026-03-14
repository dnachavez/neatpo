"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { AuthGuard } from "@/features/auth";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
