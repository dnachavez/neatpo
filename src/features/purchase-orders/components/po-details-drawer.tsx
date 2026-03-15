"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PoStatus = "draft" | "processing" | "completed";

const statusConfig: Record<PoStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
  },
  processing: {
    label: "Processing",
    className: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50",
  },
  completed: {
    label: "Completed",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  },
};

interface PoDetailsDrawerProps {
  purchaseOrderId: Id<"purchaseOrders">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PoDetailsDrawer({
  purchaseOrderId,
  open,
  onOpenChange,
}: PoDetailsDrawerProps) {
  const po = useQuery(
    api.purchaseOrders.getById,
    open ? { id: purchaseOrderId } : "skip",
  );

  const cfg = po ? statusConfig[po.status] : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="border-neutral-200 bg-white sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-serif text-lg font-normal tracking-tight">
            {po ? po.poNumber : <Skeleton className="h-5 w-32" />}
          </SheetTitle>
          <SheetDescription className="text-sm text-neutral-400">
            Purchase order details
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-6 px-4">
          {po === undefined ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ))}
            </div>
          ) : po === null ? (
            <p className="py-8 text-center text-sm text-neutral-400">
              Purchase order not found.
            </p>
          ) : (
            <>
              {/* Summary fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-neutral-400">
                    Supplier
                  </p>
                  <p className="text-sm text-black">{po.supplier}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-400">Status</p>
                  <div className="mt-0.5">
                    {cfg && (
                      <Badge variant="outline" className={cfg.className}>
                        {cfg.label}
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-400">
                    Order Date
                  </p>
                  <p className="text-sm text-black tabular-nums">
                    {format(new Date(po.orderDate), "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-400">
                    Expected Delivery
                  </p>
                  <p className="text-sm text-black tabular-nums">
                    {format(new Date(po.expectedDeliveryDate), "MMM d, yyyy")}
                  </p>
                </div>
                {po.totalAmount && (
                  <div>
                    <p className="text-xs font-medium text-neutral-400">
                      Total Amount
                    </p>
                    <p className="text-sm text-black">
                      {po.currency ? `${po.currency} ` : ""}
                      {po.totalAmount}
                    </p>
                  </div>
                )}
                {po.trackingNumber && (
                  <div>
                    <p className="text-xs font-medium text-neutral-400">
                      Tracking Number
                    </p>
                    <p className="text-sm text-black">{po.trackingNumber}</p>
                  </div>
                )}
              </div>

              {po.shippingDetails && (
                <div>
                  <p className="text-xs font-medium text-neutral-400">
                    Shipping Details
                  </p>
                  <p className="mt-0.5 text-sm text-black">
                    {po.shippingDetails}
                  </p>
                </div>
              )}

              {po.notes && (
                <div>
                  <p className="text-xs font-medium text-neutral-400">Notes</p>
                  <p className="mt-0.5 text-sm text-black">{po.notes}</p>
                </div>
              )}

              {/* Items table */}
              <div>
                <p className="mb-2 text-xs font-medium text-neutral-400">
                  Items ({po.items.length})
                </p>
                <div className="rounded-md border border-neutral-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-neutral-200 hover:bg-transparent">
                        <TableHead className="text-xs font-medium text-neutral-400">
                          Product
                        </TableHead>
                        <TableHead className="text-right text-xs font-medium text-neutral-400">
                          Qty
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {po.items.map((item, idx) => (
                        <TableRow
                          key={idx}
                          className="border-neutral-100 hover:bg-neutral-50"
                        >
                          <TableCell className="text-sm text-black">
                            {item.product}
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums text-neutral-600">
                            {item.quantity}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
