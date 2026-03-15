"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { FileText, File } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentActivity() {
  const purchaseOrders = useQuery(api.purchaseOrders.list);
  const documents = useQuery(api.documents.list);

  const isLoading = purchaseOrders === undefined || documents === undefined;

  type ActivityItem = {
    id: string;
    type: "po" | "doc";
    title: string;
    subtitle: string;
    timestamp: number;
    status: string;
  };

  const activities: ActivityItem[] = [];

  if (purchaseOrders) {
    for (const po of purchaseOrders.slice(0, 5)) {
      activities.push({
        id: `po-${po._id}`,
        type: "po",
        title: po.poNumber,
        subtitle: po.supplier,
        timestamp: po.createdAt,
        status: po.status,
      });
    }
  }

  if (documents) {
    for (const doc of documents.slice(0, 5)) {
      activities.push({
        id: `doc-${doc._id}`,
        type: "doc",
        title: doc.filename,
        subtitle: doc.matchedPoNumber
          ? `Linked to ${doc.matchedPoNumber}`
          : "No PO linked",
        timestamp: doc.uploadedAt,
        status: doc.status,
      });
    }
  }

  activities.sort((a, b) => b.timestamp - a.timestamp);
  const recentActivities = activities.slice(0, 8);

  const poStatusColors: Record<string, string> = {
    draft: "border-amber-200 bg-amber-50 text-amber-700",
    processing: "border-blue-200 bg-blue-50 text-blue-700",
    completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  const docStatusColors: Record<string, string> = {
    uploaded: "border-neutral-200 bg-neutral-50 text-neutral-600",
    processing: "border-blue-200 bg-blue-50 text-blue-700",
    extracted: "border-amber-200 bg-amber-50 text-amber-700",
    matched: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <Card className="border-neutral-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : recentActivities.length > 0 ? (
          <div className="space-y-1.5">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-neutral-50"
              >
                <div className="flex items-center gap-2.5">
                  {activity.type === "po" ? (
                    <FileText
                      size={14}
                      className="text-blue-500"
                      weight="bold"
                    />
                  ) : (
                    <File
                      size={14}
                      className="text-neutral-400"
                      weight="bold"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-black">
                      {activity.title}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {activity.subtitle}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      activity.type === "po"
                        ? (poStatusColors[activity.status] ?? "")
                        : (docStatusColors[activity.status] ?? "")
                    }`}
                  >
                    {activity.status.charAt(0).toUpperCase() +
                      activity.status.slice(1)}
                  </Badge>
                  <span className="text-[10px] text-neutral-400">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-neutral-400">
            No activity yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
