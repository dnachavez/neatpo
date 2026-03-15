"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { FileText, UploadSimple, ArrowRight } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityItem {
  id: string;
  type: "po_created" | "document_uploaded";
  title: string;
  timestamp: string;
  sortKey: number;
}

export function RecentActivity() {
  const purchaseOrders = useQuery(api.purchaseOrders.list);
  const documents = useQuery(api.documents.list);

  const recentItems = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    if (purchaseOrders) {
      for (const po of purchaseOrders.slice(0, 5)) {
        items.push({
          id: `po-${po._id}`,
          type: "po_created",
          title: `${po.poNumber} created for ${po.supplier}`,
          timestamp: formatDistanceToNow(new Date(po.createdAt), {
            addSuffix: true,
          }),
          sortKey: po.createdAt,
        });
      }
    }

    if (documents) {
      for (const doc of documents.slice(0, 5)) {
        items.push({
          id: `doc-${doc._id}`,
          type: "document_uploaded",
          title: `${doc.filename} uploaded`,
          timestamp: formatDistanceToNow(new Date(doc.uploadedAt), {
            addSuffix: true,
          }),
          sortKey: doc.uploadedAt,
        });
      }
    }

    return items.sort((a, b) => b.sortKey - a.sortKey).slice(0, 8);
  }, [purchaseOrders, documents]);

  const isLoading = purchaseOrders === undefined || documents === undefined;

  return (
    <Card className="border-neutral-200 bg-white shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
          Recent Activity
        </CardTitle>
        <button className="flex items-center gap-1 text-xs font-medium text-neutral-400 transition-colors hover:text-black">
          View all <ArrowRight size={12} />
        </button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="flex items-center gap-3 py-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                {i < 3 && <Separator className="bg-neutral-100" />}
              </div>
            ))}
          </div>
        ) : recentItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-400">
            No recent activity
          </p>
        ) : (
          <div className="space-y-0">
            {recentItems.map((item, index) => (
              <div key={item.id}>
                <div className="flex items-center gap-3 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-100">
                    {item.type === "po_created" ? (
                      <FileText size={16} className="text-neutral-500" />
                    ) : (
                      <UploadSimple size={16} className="text-neutral-500" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm text-black">{item.title}</span>
                    <span className="text-[11px] text-neutral-400">
                      {item.timestamp}
                    </span>
                  </div>
                </div>
                {index < recentItems.length - 1 && (
                  <Separator className="bg-neutral-100" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
