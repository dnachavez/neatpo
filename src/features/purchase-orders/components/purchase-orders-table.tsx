"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PoStatus = "draft" | "processing" | "completed";

const statusVariant: Record<PoStatus, "default" | "secondary" | "outline"> = {
  draft: "outline",
  processing: "secondary",
  completed: "default",
};

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function PurchaseOrdersTable() {
  const orders = useQuery(api.purchaseOrders.list);

  return (
    <Card className="border-neutral-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
          All Purchase Orders
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders === undefined ? (
          <TableSkeleton />
        ) : orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-400">
            No purchase orders yet. Create one to get started.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-200 hover:bg-transparent">
                <TableHead className="text-xs font-medium text-neutral-400">
                  PO Number
                </TableHead>
                <TableHead className="text-xs font-medium text-neutral-400">
                  Supplier
                </TableHead>
                <TableHead className="text-xs font-medium text-neutral-400">
                  Status
                </TableHead>
                <TableHead className="text-xs font-medium text-neutral-400">
                  Order Date
                </TableHead>
                <TableHead className="text-right text-xs font-medium text-neutral-400">
                  Expected Delivery
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order._id}
                  className="border-neutral-100 hover:bg-neutral-50"
                >
                  <TableCell className="text-sm font-medium text-black">
                    {order.poNumber}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-600">
                    {order.supplier}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariant[order.status]}
                      className="text-[11px] font-medium capitalize"
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-neutral-400 tabular-nums">
                    {formatDate(order.orderDate)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-neutral-400 tabular-nums">
                    {formatDate(order.expectedDeliveryDate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
