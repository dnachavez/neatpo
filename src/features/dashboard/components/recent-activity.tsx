"use client";

import {
  FileText,
  UploadSimple,
  ArrowRight,
} from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ActivityItem {
  id: string;
  type: "po_created" | "document_uploaded";
  title: string;
  timestamp: string;
}

const recentItems: ActivityItem[] = [
  {
    id: "1",
    type: "po_created",
    title: "PO-2026-001 created for Maersk Logistics",
    timestamp: "Just now",
  },
  {
    id: "2",
    type: "document_uploaded",
    title: "invoice_march_2026.pdf uploaded",
    timestamp: "2 minutes ago",
  },
  {
    id: "3",
    type: "po_created",
    title: "PO-2026-002 created for DHL Supply Chain",
    timestamp: "15 minutes ago",
  },
  {
    id: "4",
    type: "document_uploaded",
    title: "bill_of_lading_0312.pdf uploaded",
    timestamp: "1 hour ago",
  },
  {
    id: "5",
    type: "document_uploaded",
    title: "packing_list_feb.pdf uploaded",
    timestamp: "3 hours ago",
  },
];

export function RecentActivity() {
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
      </CardContent>
    </Card>
  );
}
