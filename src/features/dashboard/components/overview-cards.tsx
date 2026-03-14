"use client";

import {
  FileText,
  Scan,
  CircleNotch,
  CheckCircle,
} from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StatCard {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
}

const stats: StatCard[] = [
  {
    title: "Total POs",
    value: "—",
    description: "Purchase orders created",
    icon: FileText,
  },
  {
    title: "Documents Processed",
    value: "—",
    description: "Successfully extracted",
    icon: CheckCircle,
  },
  {
    title: "Pending OCR",
    value: "—",
    description: "Awaiting extraction",
    icon: CircleNotch,
  },
  {
    title: "Matched Documents",
    value: "—",
    description: "Linked to purchase orders",
    icon: Scan,
  },
];

export function OverviewCards() {
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
