"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  FileText,
  Scan,
  CircleNotch,
  CheckCircle,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OverviewCards() {
  const purchaseOrders = useQuery(api.purchaseOrders.list);
  const documentCounts = useQuery(api.documents.countByStatus);

  const stats = [
    {
      title: "Total POs",
      value: purchaseOrders?.length ?? 0,
      description: "Purchase orders created",
      icon: FileText,
    },
    {
      title: "Documents Processed",
      value:
        (documentCounts?.extracted ?? 0) + (documentCounts?.matched ?? 0),
      description: "Successfully extracted",
      icon: CheckCircle,
    },
    {
      title: "Pending OCR",
      value:
        (documentCounts?.uploaded ?? 0) + (documentCounts?.processing ?? 0),
      description: "Awaiting extraction",
      icon: CircleNotch,
    },
    {
      title: "Matched Documents",
      value: documentCounts?.matched ?? 0,
      description: "Linked to purchase orders",
      icon: Scan,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className="border-neutral-200 bg-white shadow-none"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              {stat.title}
            </CardTitle>
            <stat.icon size={18} className="text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl tracking-tight text-black">
              {stat.value}
            </div>
            <p className="mt-1 text-xs text-neutral-400">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
