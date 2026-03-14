"use client";

import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/app-sidebar";
import Link from "next/link";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/purchase-orders": "Purchase Orders",
  "/scan": "Scan & Upload",
  "/documents": "Document History",
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPage = pageTitles[pathname] ?? "Dashboard";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-neutral-100">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-neutral-200 bg-white px-4">
          <SidebarTrigger className="-ml-1 text-neutral-500 hover:text-black" />
          <Separator
            orientation="vertical"
            className="mr-2 h-4 bg-neutral-200"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={<Link href="/" />}
                  className="text-xs text-neutral-400 hover:text-neutral-600"
                >
                  NeatPO
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-neutral-300" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-xs text-black">
                  {currentPage}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="min-h-screen p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
