"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowsClockwise,
  DotsThree,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Id } from "../../../../convex/_generated/dataModel";

type PoStatus = "draft" | "processing" | "completed";

const statusConfig: Record<PoStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  processing: {
    label: "Processing",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  completed: {
    label: "Completed",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

export function PurchaseOrdersTable() {
  const purchaseOrders = useQuery(api.purchaseOrders.list);
  const updateStatus = useMutation(api.purchaseOrders.updateStatus);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PoStatus | "all">("all");

  const isLoading = purchaseOrders === undefined;

  const filtered = purchaseOrders?.filter((po) => {
    const matchesSearch =
      !searchQuery ||
      po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleStatusChange(
    id: Id<"purchaseOrders">,
    status: PoStatus,
  ) {
    try {
      await updateStatus({ id, status });
      toast.success(`Status updated to ${statusConfig[status].label}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder="Search by PO number or supplier…"
            className="border-neutral-200 bg-white pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(val) =>
            setStatusFilter(val as PoStatus | "all")
          }
        >
          <SelectTrigger className="h-9 w-36 border-neutral-200 bg-white text-sm">
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

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-neutral-200">
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-200 bg-neutral-50/50">
                <TableHead className="text-xs font-medium text-neutral-500">
                  PO Number
                </TableHead>
                <TableHead className="text-xs font-medium text-neutral-500">
                  Supplier
                </TableHead>
                <TableHead className="text-xs font-medium text-neutral-500">
                  Status
                </TableHead>
                <TableHead className="text-xs font-medium text-neutral-500">
                  Delivery Fee
                </TableHead>
                <TableHead className="text-xs font-medium text-neutral-500">
                  Created
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((po) => {
                const conf = statusConfig[po.status];
                return (
                  <TableRow key={po._id} className="border-neutral-200">
                    <TableCell className="text-sm font-medium text-black">
                      {po.poNumber}
                    </TableCell>
                    <TableCell className="text-sm text-neutral-600">
                      {po.supplier}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${conf.className}`}
                      >
                        {conf.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-neutral-600">
                      {po.deliveryFee != null
                        ? `${po.currency ?? "$"}${po.deliveryFee.toFixed(2)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-[11px] text-neutral-400">
                      {formatDistanceToNow(new Date(po.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-neutral-400 hover:text-black"
                            />
                          }
                        >
                          <DotsThree size={16} weight="bold" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <ArrowsClockwise
                                size={14}
                                className="mr-2"
                              />
                              Status
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {(
                                ["draft", "processing", "completed"] as const
                              ).map((s) => (
                                <DropdownMenuItem
                                  key={s}
                                  onClick={() =>
                                    handleStatusChange(po._id, s)
                                  }
                                >
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] ${statusConfig[s].className}`}
                                  >
                                    {statusConfig[s].label}
                                  </Badge>
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
      ) : (
        <p className="py-8 text-center text-sm text-neutral-400">
          {searchQuery || statusFilter !== "all"
            ? "No purchase orders match your filters"
            : "No purchase orders yet. Create your first PO to get started."}
        </p>
      )}
    </div>
  );
}
