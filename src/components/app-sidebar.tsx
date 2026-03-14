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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
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
    <Sidebar collapsible="icon" className="border-r border-neutral-200 bg-white">
      <SidebarHeader className={cn("h-12 justify-center", isCollapsed ? "px-0" : "px-5")}>
        <Link
          href="/"
          className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "gap-2"
          )}
        >
          <span className="font-serif text-xl tracking-tight text-black">
            {isCollapsed ? "N" : "NeatPO"}
          </span>
        </Link>
        {!isCollapsed && (
          <p className="-mt-3 text-[11px] leading-tight text-neutral-400">
            Logistics Document Automation
          </p>
        )}
      </SidebarHeader>

      <Separator className="bg-neutral-200" />

      <SidebarContent className={cn("py-3", !isCollapsed && "px-3")}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={<Link href={item.href} />}
                      className={cn(
                        "h-9 gap-3 rounded-md px-3 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black",
                        isActive &&
                          "!bg-black !text-white hover:!bg-neutral-800 hover:!text-white"
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

      <SidebarFooter className={cn("py-4", isCollapsed ? "px-0" : "px-5")}>
        {!isCollapsed && <Separator className="mb-4 bg-neutral-200" />}
        {isCollapsed ? (
          <div className="flex justify-center">
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-200"
                    title={authUser?.name ?? "User"}
                  />
                }
              >
                {initials}
              </PopoverTrigger>
              <PopoverContent
                side="right"
                align="end"
                className="w-48 p-1.5"
              >
                <div className="border-b border-neutral-200 px-2 pb-1.5 mb-1.5">
                  <p className="text-sm font-medium text-black">
                    {authUser?.name ?? "User"}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {authUser?.email ?? ""}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-black"
                >
                  <SignOut size={14} />
                  <span>Sign out</span>
                </button>
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
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
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
