"use client";

import {
  OverviewCards,
  DeliveryPredictions,
  SpendAnalytics,
  RecentActivity,
  ProcessingStatus,
} from "@/features/dashboard";

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-serif text-2xl tracking-tight text-black">
          Dashboard
        </h1>
        <p className="text-sm text-neutral-400">
          Overview of your supply chain operations
        </p>
      </div>

      <OverviewCards />

      <div className="grid gap-6 lg:grid-cols-2">
        <DeliveryPredictions />
        <SpendAnalytics />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity />
        <ProcessingStatus />
      </div>
    </div>
  );
}
