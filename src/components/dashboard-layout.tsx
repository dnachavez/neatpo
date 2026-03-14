"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-neutral-100">
        <main className="min-h-screen p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
