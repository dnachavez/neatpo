"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  ChartBar,
  Storefront,
  CurrencyDollar,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SpendAnalytics() {
  const analytics = useQuery(api.purchaseOrders.analytics);
  const isLoading = analytics === undefined;

  if (isLoading) {
    return (
      <Card className="border-neutral-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle className="font-serif text-lg font-normal tracking-tight">
            Spend Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const hasData = analytics.totalPOs > 0;

  // Monthly breakdown — sorted by month
  const monthEntries = Object.entries(analytics.byMonth)
    .map(([month, count]) => ({ month, count: count as number }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Last 6 months

  const maxMonthCount = Math.max(
    ...monthEntries.map((e) => e.count),
    1,
  );

  // Top suppliers by count
  const supplierEntries = Object.entries(analytics.bySupplier)
    .map(([supplier, data]) => ({
      supplier,
      count: (data as { count: number; totalFee: number }).count,
      totalFee: (data as { count: number; totalFee: number }).totalFee,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const avgPoValue =
    analytics.totalPOs > 0
      ? analytics.totalSpend / analytics.totalPOs
      : 0;

  return (
    <Card className="border-neutral-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
          Spend Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            Create purchase orders to see spend analytics.
          </p>
        ) : (
          <div className="space-y-5">
            {/* Average PO Value */}
            <div className="flex items-center gap-3 rounded-md border border-neutral-200 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-50">
                <CurrencyDollar
                  size={16}
                  className="text-violet-600"
                  weight="bold"
                />
              </div>
              <div>
                <p className="text-[11px] font-medium text-neutral-400">
                  Average PO Value
                </p>
                <p className="text-lg font-semibold tracking-tight text-black">
                  ${avgPoValue.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Monthly PO Count */}
            {monthEntries.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ChartBar
                    size={14}
                    className="text-neutral-400"
                    weight="bold"
                  />
                  <p className="text-[11px] font-medium text-neutral-400">
                    Monthly PO Volume
                  </p>
                </div>
                <div className="flex items-end gap-1.5">
                  {monthEntries.map((entry) => {
                    const heightPct = (entry.count / maxMonthCount) * 100;
                    const monthLabel = entry.month.slice(-2);
                    return (
                      <div
                        key={entry.month}
                        className="flex flex-1 flex-col items-center gap-1"
                      >
                        <span className="text-[9px] font-medium text-neutral-500">
                          {entry.count}
                        </span>
                        <div className="flex h-16 w-full items-end">
                          <div
                            className="w-full rounded-t-sm bg-blue-200 transition-all"
                            style={{
                              height: `${Math.max(heightPct, 8)}%`,
                            }}
                          />
                        </div>
                        <span className="text-[9px] text-neutral-400">
                          {monthLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top Suppliers */}
            {supplierEntries.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Storefront
                    size={14}
                    className="text-neutral-400"
                    weight="bold"
                  />
                  <p className="text-[11px] font-medium text-neutral-400">
                    Top Suppliers
                  </p>
                </div>
                <div className="space-y-1.5">
                  {supplierEntries.map((s) => (
                    <div
                      key={s.supplier}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-neutral-600">{s.supplier}</span>
                      <span className="text-[11px] text-neutral-400">
                        {s.count} PO{s.count > 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
