"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  draft: {
    label: "Pending",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
  },
  processing: {
    label: "Processing",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50",
  },
  completed: {
    label: "Completed",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  },
};

interface PoListingProps {
  searchQuery: string;
}

export function PoListing({ searchQuery }: PoListingProps) {
  const trimmed = searchQuery.trim();
  const allOrders = useQuery(api.purchaseOrders.list);
  const searchResults = useQuery(
    api.purchaseOrders.search,
    trimmed ? { query: trimmed } : "skip",
  );

  const orders = trimmed ? searchResults : allOrders;

  if (orders === undefined) {
    return (
      <p className="py-8 text-center text-sm text-neutral-400">
        Loading purchase orders…
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-400">
        {trimmed
          ? "No purchase orders match your search."
          : "No purchase orders yet."}
      </p>
    );
  }

  return (
    <div className="rounded-md border border-neutral-200">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-neutral-500">PO Number</TableHead>
            <TableHead className="text-neutral-500">Supplier</TableHead>
            <TableHead className="text-neutral-500">Order Date</TableHead>
            <TableHead className="text-right text-neutral-500">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((po) => {
            const cfg = statusConfig[po.status] ?? statusConfig.draft;
            return (
              <TableRow key={po._id}>
                <TableCell className="font-medium text-black">
                  {po.poNumber}
                </TableCell>
                <TableCell className="text-neutral-600">
                  {po.supplier}
                </TableCell>
                <TableCell className="text-neutral-600">
                  {format(new Date(po.orderDate), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className={cfg.className}>
                    {cfg.label}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
