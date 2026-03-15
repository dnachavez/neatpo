"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  FileText,
  CheckCircle,
  CurrencyDollar,
  Truck,
  Files,
  CircleNotch,
} from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function OverviewCards() {
  const analytics = useQuery(api.purchaseOrders.analytics);
  const docCounts = useQuery(api.documents.countByStatus);

  const isLoading = analytics === undefined || docCounts === undefined;

  const cards = [
    {
      title: "Total POs",
      value: analytics?.totalPOs ?? 0,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Completed",
      value: analytics?.byStatus.completed ?? 0,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Total Spend",
      value: analytics
        ? `$${analytics.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "$0.00",
      icon: CurrencyDollar,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      title: "Avg Delivery Fee",
      value: analytics ? `$${analytics.avgDeliveryFee.toFixed(2)}` : "$0.00",
      icon: Truck,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Docs Processed",
      value: docCounts ? docCounts.extracted + docCounts.matched : 0,
      icon: Files,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      title: "Pending OCR",
      value: docCounts ? docCounts.uploaded + docCounts.processing : 0,
      icon: CircleNotch,
      color: "text-neutral-600",
      bg: "bg-neutral-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="border-neutral-200 bg-white shadow-none"
        >
          <CardContent className="p-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-7 w-12" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-md ${card.bg}`}
                  >
                    <card.icon size={14} className={card.color} weight="bold" />
                  </div>
                  <span className="text-[11px] font-medium text-neutral-400">
                    {card.title}
                  </span>
                </div>
                <p className="mt-2 text-xl font-semibold tracking-tight text-black">
                  {card.value}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
