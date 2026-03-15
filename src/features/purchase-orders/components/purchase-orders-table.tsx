"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  Files,
  MagnifyingGlass,
  DotsThreeVertical,
  Check,
  ArrowsClockwise,
  Eye,
} from "@phosphor-icons/react";
import { toast } from "sonner";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { PoDetailsDrawer } from "./po-details-drawer";

type PoStatus = "draft" | "processing" | "completed";

const ALL_STATUSES = "all" as const;

const statusLabel: Record<PoStatus, string> = {
  draft: "Draft",
  processing: "Processing",
  completed: "Completed",
};

const statusConfig: Record<PoStatus, { className: string }> = {
  draft: {
    className: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
  },
  processing: {
    className: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50",
  },
  completed: {
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  },
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

const PO_STATUSES: PoStatus[] = ["draft", "processing", "completed"];

export function PurchaseOrdersTable() {
  const orders = useQuery(api.purchaseOrders.list);
  const updateStatus = useMutation(api.purchaseOrders.updateStatus);
  const [drawerPo, setDrawerPo] = useState<{
    id: Id<"purchaseOrders">;
    poNumber: string;
  } | null>(null);
  const [detailsPo, setDetailsPo] = useState<Id<"purchaseOrders"> | null>(null);

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
                        variant="outline"
                        className={`text-[11px] font-medium ${statusConfig[order.status].className}`}
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-neutral-500 hover:text-black"
                          >
                            <DotsThreeVertical size={16} weight="bold" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setDetailsPo(order._id)}
                          >
                            <Eye size={14} />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setDrawerPo({
                                id: order._id,
                                poNumber: order.poNumber,
                              })
                            }
                          >
                            <Files size={14} />
                            Documents
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <ArrowsClockwise size={14} />
                              Status
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {PO_STATUSES.map((s) => (
                                <DropdownMenuItem
                                  key={s}
                                  disabled={order.status === s}
                                  onClick={() => {
                                    updateStatus({ id: order._id, status: s })
                                      .then(() =>
                                        toast.success(
                                          `Status updated to ${statusLabel[s]}`,
                                        ),
                                      )
                                      .catch(() =>
                                        toast.error("Failed to update status"),
                                      );
                                  }}
                                >
                                  {order.status === s && (
                                    <Check size={14} weight="bold" />
                                  )}
                                  {statusLabel[s]}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {detailsPo && (
        <PoDetailsDrawer
          purchaseOrderId={detailsPo}
          open={!!detailsPo}
          onOpenChange={(open) => {
            if (!open) setDetailsPo(null);
          }}
        />
      )}
    </>
  );
}
