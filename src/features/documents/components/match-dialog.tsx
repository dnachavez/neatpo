"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { LinkSimple, MagnifyingGlass } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MatchDialogProps {
  documentId?: Id<"documents">;
}

export function MatchDialog({ documentId }: MatchDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPoId, setSelectedPoId] = useState<Id<"purchaseOrders"> | null>(
    null,
  );

  const purchaseOrders = useQuery(api.purchaseOrders.list);
  const matchToPO = useMutation(api.documents.matchToPO);

  const filteredPOs = purchaseOrders?.filter(
    (po) =>
      po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplier.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  async function handleMatch() {
    if (!documentId || !selectedPoId) return;

    try {
      await matchToPO({
        id: documentId,
        purchaseOrderId: selectedPoId,
      });
      toast.success("Document linked to purchase order");
      setSearchQuery("");
      setSelectedPoId(null);
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to match";
      toast.error("Failed to match document", { description: message });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="border-neutral-200 text-neutral-500 hover:text-black"
          />
        }
      >
        <LinkSimple size={16} />
        Match to PO
      </DialogTrigger>
      <DialogContent className="border-neutral-200 bg-white sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-normal tracking-tight">
            Match Document to PO
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-400">
            Link this document to an existing purchase order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Search Purchase Orders</Label>
            <div className="relative">
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
          </div>

          <div className="max-h-48 space-y-1 overflow-y-auto">
            {filteredPOs?.map((po) => (
              <button
                key={po._id}
                type="button"
                onClick={() =>
                  setSelectedPoId(selectedPoId === po._id ? null : po._id)
                }
                className={cn(
                  "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors",
                  selectedPoId === po._id
                    ? "border-black bg-neutral-50 text-black"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
                )}
              >
                <div>
                  <span className="font-medium">{po.poNumber}</span>
                  <span className="ml-2 text-neutral-400">{po.supplier}</span>
                </div>
                {selectedPoId === po._id && (
                  <Badge variant="default" className="text-[10px]">
                    Selected
                  </Badge>
                )}
              </button>
            ))}
            {filteredPOs?.length === 0 && (
              <p className="py-4 text-center text-sm text-neutral-400">
                No purchase orders found
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="border-neutral-200"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMatch}
              disabled={!selectedPoId || !documentId}
              className="bg-black text-white hover:bg-neutral-800"
            >
              Match Document
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
