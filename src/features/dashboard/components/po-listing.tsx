"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { format } from "date-fns";
import {
  DotsThreeVertical,
  Check,
  Files,
  ArrowsClockwise,
  Eye,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PoDocumentsDrawer } from "@/features/purchase-orders/components/po-documents-drawer";
import { PoDetailsDrawer } from "@/features/purchase-orders/components/po-details-drawer";

type PoStatus = "draft" | "processing" | "completed";
const ALL_STATUSES = "all" as const;

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
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

const PO_STATUSES: PoStatus[] = ["draft", "processing", "completed"];

const statusLabels: Record<PoStatus, string> = {
  draft: "Draft",
  processing: "Processing",
  completed: "Completed",
};

interface PoListingProps {
  searchQuery: string;
  statusFilter: PoStatus | typeof ALL_STATUSES;
}

export function PoListing({ searchQuery, statusFilter }: PoListingProps) {
  const trimmed = searchQuery.trim();
  const allOrders = useQuery(api.purchaseOrders.list);
  const updateStatus = useMutation(api.purchaseOrders.updateStatus);
  const searchResults = useQuery(
    api.purchaseOrders.search,
    trimmed ? { query: trimmed } : "skip",
  );

  const [drawerPo, setDrawerPo] = useState<{
    id: Id<"purchaseOrders">;
    poNumber: string;
  } | null>(null);
  const [detailsPo, setDetailsPo] = useState<Id<"purchaseOrders"> | null>(null);

  const baseOrders = trimmed ? searchResults : allOrders;

  const orders = useMemo(() => {
    if (!baseOrders) return undefined;
    if (statusFilter === ALL_STATUSES) return baseOrders;
    return baseOrders.filter((po) => po.status === statusFilter);
  }, [baseOrders, statusFilter]);

  if (orders === undefined) {
    return (
      <div className="rounded-md border border-neutral-200">
        <div className="space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="ml-auto h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-400">
        {trimmed || statusFilter !== ALL_STATUSES
          ? "No purchase orders match your filters."
          : "No purchase orders yet."}
      </p>
    );
  }

  return (
    <>
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
              <TableHead className="w-10" />
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
                          onClick={() => setDetailsPo(po._id)}
                        >
                          <Eye size={14} />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setDrawerPo({
                              id: po._id,
                              poNumber: po.poNumber,
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
                                disabled={po.status === s}
                                onClick={() => {
                                  updateStatus({ id: po._id, status: s })
                                    .then(() =>
                                      toast.success(
                                        `Status updated to ${statusLabels[s]}`,
                                      ),
                                    )
                                    .catch(() =>
                                      toast.error("Failed to update status"),
                                    );
                                }}
                              >
                                {po.status === s && (
                                  <Check size={14} weight="bold" />
                                )}
                                {statusLabels[s]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

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
