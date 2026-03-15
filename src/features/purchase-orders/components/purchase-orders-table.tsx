"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Files, MagnifyingGlass } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PoDocumentsDrawer } from "./po-documents-drawer";

type PoStatus = "draft" | "processing" | "completed";

const ALL_STATUSES = "all" as const;

const statusLabel: Record<PoStatus, string> = {
  draft: "Draft",
  processing: "Processing",
  completed: "Completed",
};

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
  const [drawerPo, setDrawerPo] = useState<{
    id: Id<"purchaseOrders">;
    poNumber: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    PoStatus | typeof ALL_STATUSES
  >(ALL_STATUSES);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== ALL_STATUSES && order.status !== statusFilter) {
        return false;
      }
      // Search filter (PO number or supplier)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPo = order.poNumber.toLowerCase().includes(q);
        const matchesSupplier = order.supplier.toLowerCase().includes(q);
        if (!matchesPo && !matchesSupplier) return false;
      }
      return true;
    });
  }, [orders, searchQuery, statusFilter]);

  if (orders === undefined) {
    return (
      <Card className="border-neutral-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
            All Purchase Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TableSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-neutral-200 bg-white shadow-none">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
              All Purchase Orders
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <MagnifyingGlass
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <Input
                  placeholder="Search by PO or supplier…"
                  className="h-8 w-56 border-neutral-200 bg-white pl-8 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(val) =>
                  setStatusFilter(val as PoStatus | typeof ALL_STATUSES)
                }
              >
                <SelectTrigger className="h-8 w-36 border-neutral-200 bg-white text-sm">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-neutral-400">
                {orders.length === 0
                  ? "No purchase orders yet. Create one to get started."
                  : "No purchase orders match your filters"}
              </p>
            </div>
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
                  <TableHead className="text-xs font-medium text-neutral-400">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
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
                        className="text-[11px] font-medium"
                      >
                        {statusLabel[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-neutral-400 tabular-nums">
                      {formatDate(order.orderDate)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-neutral-400 tabular-nums">
                      {formatDate(order.expectedDeliveryDate)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-neutral-500 hover:text-black"
                        onClick={() =>
                          setDrawerPo({
                            id: order._id,
                            poNumber: order.poNumber,
                          })
                        }
                      >
                        <Files size={14} />
                        Docs
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {drawerPo && (
        <PoDocumentsDrawer
          purchaseOrderId={drawerPo.id}
          poNumber={drawerPo.poNumber}
          open={!!drawerPo}
          onOpenChange={(open) => {
            if (!open) setDrawerPo(null);
          }}
        />
      )}
    </>
  );
}
