import type { Metadata } from "next";
import {
  OverviewCards,
  RecentActivity,
  ProcessingStatus,
  PoSection,
} from "@/features/dashboard";

export const metadata: Metadata = {
  title: "Dashboard — NeatPO",
  description:
    "Complete operational visibility for your logistics document automation.",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl tracking-tight text-black">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Operational overview of your logistics document pipeline
        </p>
      </div>

      <OverviewCards />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity />
        <ProcessingStatus />
      </div>

      <PoSection />
    </div>
  );
}

