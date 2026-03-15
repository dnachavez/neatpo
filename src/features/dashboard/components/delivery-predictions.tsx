"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  TrendUp,
  TrendDown,
  Minus,
  CalendarCheck,
  Truck,
  Storefront,
  CurrencyDollar,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DeliveryPredictions() {
  const analytics = useQuery(api.purchaseOrders.analytics);
  const isLoading = analytics === undefined;

  if (isLoading) {
    return (
      <Card className="border-neutral-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle className="font-serif text-lg font-normal tracking-tight">
            Delivery Predictions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const hasData = analytics.posWithFees > 0;

  // 1. Optimal delivery window — find day with lowest avg fee
  const dayEntries = Object.entries(analytics.dayOfWeekAvgFees).map(
    ([day, avg]) => ({
      day: Number(day),
      avg: avg as number,
    }),
  );
  dayEntries.sort((a, b) => a.avg - b.avg);
  const bestDay = dayEntries.length > 0 ? dayEntries[0] : null;
  const worstDay = dayEntries.length > 0 ? dayEntries[dayEntries.length - 1] : null;

  // 2. Fee trend — compute from monthly data if available
  const monthEntries = Object.entries(analytics.byMonth);
  monthEntries.sort((a, b) => a[0].localeCompare(b[0]));
  let trendDirection: "up" | "down" | "stable" = "stable";
  if (monthEntries.length >= 2) {
    const recentMonth = monthEntries[monthEntries.length - 1][1] as number;
    const priorMonth = monthEntries[monthEntries.length - 2][1] as number;
    if (recentMonth > priorMonth) trendDirection = "up";
    else if (recentMonth < priorMonth) trendDirection = "down";
  }

  // 3. Supplier comparison
  const supplierEntries = Object.entries(analytics.supplierAvgFees)
    .map(([supplier, avgFee]) => ({
      supplier,
      avgFee: avgFee as number,
    }))
    .filter((s) => s.avgFee > 0)
    .sort((a, b) => a.avgFee - b.avgFee);

  const cheapestSupplier =
    supplierEntries.length > 0 ? supplierEntries[0] : null;

  // 4. Savings potential
  const savingsPotential =
    bestDay && worstDay && analytics.totalPOs > 0
      ? (worstDay.avg - bestDay.avg) * analytics.totalPOs
      : 0;

  return (
    <Card className="border-neutral-200 bg-white shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
            Delivery Predictions
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            {analytics.posWithFees} POs analyzed
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            Add delivery fees to your purchase orders to unlock predictions.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Optimal Delivery Window */}
            <div className="flex items-start gap-3 rounded-md border border-neutral-200 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50">
                <CalendarCheck
                  size={16}
                  className="text-emerald-600"
                  weight="bold"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-black">
                  Best Day to Receive Deliveries
                </p>
                {bestDay && (
                  <p className="mt-0.5 text-sm text-neutral-500">
                    <span className="font-medium text-emerald-700">
                      {dayNames[bestDay.day]}
                    </span>{" "}
                    — avg fee{" "}
                    <span className="font-medium">
                      ${bestDay.avg.toFixed(2)}
                    </span>
                    {worstDay && worstDay.day !== bestDay.day && (
                      <span className="text-neutral-400">
                        {" "}
                        (vs {dayNames[worstDay.day]} at $
                        {worstDay.avg.toFixed(2)})
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Fee Trend */}
            <div className="flex items-start gap-3 rounded-md border border-neutral-200 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50">
                <Truck size={16} className="text-blue-600" weight="bold" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-black">
                  Average Delivery Fee
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-sm font-medium text-black">
                    ${analytics.avgDeliveryFee.toFixed(2)}
                  </span>
                  {trendDirection === "up" ? (
                    <div className="flex items-center gap-0.5 text-red-600">
                      <TrendUp size={12} weight="bold" />
                      <span className="text-[10px]">Rising</span>
                    </div>
                  ) : trendDirection === "down" ? (
                    <div className="flex items-center gap-0.5 text-emerald-600">
                      <TrendDown size={12} weight="bold" />
                      <span className="text-[10px]">Falling</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5 text-neutral-400">
                      <Minus size={12} weight="bold" />
                      <span className="text-[10px]">Stable</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Supplier Comparison */}
            {cheapestSupplier && (
              <div className="flex items-start gap-3 rounded-md border border-neutral-200 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-50">
                  <Storefront
                    size={16}
                    className="text-violet-600"
                    weight="bold"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-black">
                    Lowest Fee Supplier
                  </p>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    <span className="font-medium text-violet-700">
                      {cheapestSupplier.supplier}
                    </span>{" "}
                    — avg fee{" "}
                    <span className="font-medium">
                      ${cheapestSupplier.avgFee.toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Savings Potential */}
            {savingsPotential > 0 && (
              <>
                <Separator className="bg-neutral-100" />
                <div className="flex items-center gap-2 rounded-md bg-emerald-50/50 px-3 py-2">
                  <CurrencyDollar
                    size={14}
                    className="text-emerald-600"
                    weight="bold"
                  />
                  <p className="text-sm text-emerald-800">
                    Estimated savings potential:{" "}
                    <span className="font-semibold">
                      ${savingsPotential.toFixed(2)}
                    </span>{" "}
                    by scheduling deliveries on{" "}
                    {bestDay ? dayNames[bestDay.day] : "optimal days"}
                  </p>
                </div>
              </>
            )}

            {/* Day-of-week breakdown */}
            {dayEntries.length > 1 && (
              <div className="mt-2 space-y-1">
                <p className="text-[11px] font-medium text-neutral-400">
                  Average Fee by Day
                </p>
                <div className="flex gap-1">
                  {dayNames.map((name, idx) => {
                    const entry = dayEntries.find((e) => e.day === idx);
                    const maxFee = Math.max(
                      ...dayEntries.map((e) => e.avg),
                    );
                    const heightPct = entry
                      ? Math.max((entry.avg / maxFee) * 100, 8)
                      : 0;
                    const isBest = bestDay?.day === idx;
                    return (
                      <div
                        key={name}
                        className="flex flex-1 flex-col items-center gap-1"
                      >
                        <div className="flex h-12 w-full items-end">
                          <div
                            className={`w-full rounded-t-sm transition-all ${isBest ? "bg-emerald-400" : entry ? "bg-neutral-200" : "bg-neutral-100"}`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span
                          className={`text-[9px] ${isBest ? "font-medium text-emerald-700" : "text-neutral-400"}`}
                        >
                          {name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
