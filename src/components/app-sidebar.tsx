"use client";

import {
  House,
  FileText,
  Scan,
  ClockCounterClockwise,
  SignOut,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authUserAtom } from "@/features/auth";

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: House,
  },
  {
    title: "Purchase Orders",
    href: "/purchase-orders",
    icon: FileText,
  },
  {
    title: "Scan & Upload",
    href: "/scan",
    icon: Scan,
  },
  {
    title: "Document History",
    href: "/documents",
    icon: ClockCounterClockwise,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const authUser = useAtomValue(authUserAtom);
  const setAuthUser = useSetAtom(authUserAtom);

  const initials = authUser?.name
    ? authUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

  function handleSignOut() {
    setAuthUser(null);
    router.replace("/login");
  }

  return (
    <Sidebar className="border-r border-neutral-200 bg-white">
      <SidebarHeader className="px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-xl tracking-tight text-black">
            NeatPO
          </span>
        </Link>
        <p className="mt-0.5 text-[11px] leading-tight text-neutral-400">
          Logistics Document Automation
        </p>
      </SidebarHeader>

      <Separator className="bg-neutral-200" />

      <SidebarContent className="px-3 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={item.href} />}
                      className={cn(
                        "h-9 gap-3 rounded-md px-3 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black",
                        isActive &&
                          "bg-black text-white hover:bg-neutral-800 hover:text-white"
                      )}
                    >
                      <item.icon
                        size={18}
                        weight={isActive ? "fill" : "regular"}
                      />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-5 py-4">
        <Separator className="mb-4 bg-neutral-200" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-black">
                {authUser?.name ?? "User"}
              </span>
              <span className="text-[11px] text-neutral-400">
                {authUser?.email ?? ""}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleSignOut}
            className="text-neutral-400 hover:text-black"
            title="Sign out"
          >
            <SignOut size={16} />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
