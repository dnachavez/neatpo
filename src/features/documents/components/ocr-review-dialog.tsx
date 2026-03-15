"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MagnifyingGlass,
  LinkSimple,
  FloppyDisk,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  extractedDataSchema,
  type ExtractedData,
} from "../types/document-schema";
import { findAutoMatch, type MatchStrategy } from "../lib/auto-match";

const reviewFormSchema = z.object({
  trackingNumber: z.string(),
  poNumber: z.string(),
  vendorName: z.string(),
  documentType: z.string(),
  items: z.array(
    z.object({
      product: z.string().min(1, "Product name is required"),
      quantity: z.number().min(1, "Quantity must be at least 1"),
    }),
  ),
  shippingDetails: z.string(),
  orderDate: z.string(),
  deliveryDate: z.string(),
  totalAmount: z.string(),
  deliveryFee: z.number().nullable(),
  currency: z.string(),
  notes: z.string(),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

interface OcrReviewDialogProps {
  documentId: Id<"documents">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const documentTypeLabels: Record<string, string> = {
  invoice: "Invoice",
  bill_of_lading: "Bill of Lading",
  packing_list: "Packing List",
  customs_declaration: "Customs Declaration",
  shipping_manifest: "Shipping Manifest",
  freight_invoice: "Freight Invoice",
  other: "Other",
};

function parseDateToTimestamp(dateStr: string): number | undefined {
  const ms = new Date(dateStr).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

export function OcrReviewDialog({
  documentId,
  open,
  onOpenChange,
}: OcrReviewDialogProps) {
  const document = useQuery(api.documents.getById, { id: documentId });
  const purchaseOrders = useQuery(api.purchaseOrders.list);
  const updateExtractedData = useMutation(api.documents.updateExtractedData);
  const matchToPO = useMutation(api.documents.matchToPO);
  const updatePO = useMutation(api.purchaseOrders.update);

  const [manualPoId, setManualPoId] = useState<Id<"purchaseOrders"> | null>(
    null,
  );
  const [poSearchQuery, setPoSearchQuery] = useState("");

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      trackingNumber: "",
      poNumber: "",
      vendorName: "",
      documentType: "other",
      items: [],
      shippingDetails: "",
      orderDate: "",
      deliveryDate: "",
      totalAmount: "",
      deliveryFee: null,
      currency: "",
      notes: "",
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const documentType = useWatch({ control, name: "documentType" });

  // Auto-match PO from extracted data
  const autoMatchResult = (() => {
    if (!document?.extractedData || !purchaseOrders) return null;
    try {
      const parsed = extractedDataSchema.parse(
        JSON.parse(document.extractedData),
      );
      return findAutoMatch(parsed, purchaseOrders);
    } catch {
      return null;
    }
  })();

  const autoMatchedPoId = autoMatchResult
    ? (autoMatchResult.purchaseOrderId as Id<"purchaseOrders">)
    : null;
  const autoMatchStrategy: MatchStrategy | null =
    autoMatchResult?.strategy ?? null;

  const selectedPoId = manualPoId ?? autoMatchedPoId;

  // Parse extracted data and populate form
  useEffect(() => {
    if (document?.extractedData) {
      try {
        const parsed = extractedDataSchema.parse(
          JSON.parse(document.extractedData),
        );
        reset({
          trackingNumber: parsed.trackingNumber ?? "",
          poNumber: parsed.poNumber ?? "",
          vendorName: parsed.vendorName ?? "",
          documentType: parsed.documentType ?? "other",
          items:
            parsed.items.length > 0
              ? parsed.items
              : [{ product: "", quantity: 1 }],
          shippingDetails: parsed.shippingDetails ?? "",
          orderDate: parsed.orderDate ?? "",
          deliveryDate: parsed.deliveryDate ?? "",
          totalAmount: parsed.totalAmount ?? "",
          deliveryFee: parsed.deliveryFee ?? null,
          currency: parsed.currency ?? "",
          notes: parsed.notes ?? "",
        });
      } catch {
        // If parsing fails, leave form with defaults
      }
    }
  }, [document?.extractedData, reset]);

  const filteredPOs = purchaseOrders?.filter(
    (po) =>
      po.poNumber.toLowerCase().includes(poSearchQuery.toLowerCase()) ||
      po.supplier.toLowerCase().includes(poSearchQuery.toLowerCase()),
  );

  async function handleSaveOnly(data: ReviewFormData) {
    try {
      const extractedData: ExtractedData = {
        documentType: data.documentType,
        trackingNumber: data.trackingNumber || null,
        poNumber: data.poNumber || null,
        vendorName: data.vendorName || null,
        items: data.items,
        shippingDetails: data.shippingDetails || null,
        orderDate: data.orderDate || null,
        deliveryDate: data.deliveryDate || null,
        totalAmount: data.totalAmount || null,
        deliveryFee: data.deliveryFee,
        currency: data.currency || null,
        notes: data.notes || null,
      };

      await updateExtractedData({
        id: documentId,
        extractedData: JSON.stringify(extractedData),
        documentType: data.documentType,
      });

      toast.success("Extraction data saved");
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed";
      toast.error("Failed to save", { description: message });
    }
  }

  async function handleConfirmAndAutoFill(data: ReviewFormData) {
    if (!selectedPoId) {
      toast.error("Please select a purchase order to auto-fill");
      return;
    }

    try {
      // Save extracted data
      const extractedData: ExtractedData = {
        documentType: data.documentType,
        trackingNumber: data.trackingNumber || null,
        poNumber: data.poNumber || null,
        vendorName: data.vendorName || null,
        items: data.items,
        shippingDetails: data.shippingDetails || null,
        orderDate: data.orderDate || null,
        deliveryDate: data.deliveryDate || null,
        totalAmount: data.totalAmount || null,
        deliveryFee: data.deliveryFee,
        currency: data.currency || null,
        notes: data.notes || null,
      };

      await updateExtractedData({
        id: documentId,
        extractedData: JSON.stringify(extractedData),
        documentType: data.documentType,
      });

      // Link document to PO
      await matchToPO({
        id: documentId,
        purchaseOrderId: selectedPoId,
      });

      // Auto-fill PO fields with extracted data
      const updateFields: Parameters<typeof updatePO>[0] = {
        id: selectedPoId,
      };

      if (data.items.length > 0) updateFields.items = data.items;
      if (data.vendorName) updateFields.supplier = data.vendorName;

      const parsedOrderDate = data.orderDate
        ? parseDateToTimestamp(data.orderDate)
        : undefined;
      if (parsedOrderDate !== undefined)
        updateFields.orderDate = parsedOrderDate;

      const parsedDeliveryDate = data.deliveryDate
        ? parseDateToTimestamp(data.deliveryDate)
        : undefined;
      if (parsedDeliveryDate !== undefined)
        updateFields.expectedDeliveryDate = parsedDeliveryDate;

      if (data.totalAmount) updateFields.totalAmount = data.totalAmount;
      if (data.deliveryFee !== null)
        updateFields.deliveryFee = data.deliveryFee;
      if (data.currency) updateFields.currency = data.currency;
      if (data.shippingDetails)
        updateFields.shippingDetails = data.shippingDetails;
      if (data.trackingNumber)
        updateFields.trackingNumber = data.trackingNumber;
      if (data.notes) updateFields.notes = data.notes;

      await updatePO(updateFields);

      toast.success("Purchase order auto-filled", {
        description: "PO fields have been updated with extracted data.",
      });
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Auto-fill failed";
      toast.error("Failed to auto-fill", { description: message });
    }
  }

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-neutral-200 bg-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-normal tracking-tight">
            Review & Auto-fill PO
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-400">
            Review extracted data from{" "}
            <span className="font-medium text-black">{document.filename}</span>,
            then select a purchase order to auto-fill its fields.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4">
          {/* Key fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tracking Number</Label>
              <Input
                className="border-neutral-200 bg-white"
                {...register("trackingNumber")}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">PO Number</Label>
              <Input
                className="border-neutral-200 bg-white"
                {...register("poNumber")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Vendor Name</Label>
              <Input
                className="border-neutral-200 bg-white"
                {...register("vendorName")}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Document Type</Label>
              <Badge variant="secondary" className="text-xs">
                {documentTypeLabels[documentType] ?? "Other"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Order Date</Label>
              <Input
                className="border-neutral-200 bg-white"
                placeholder="YYYY-MM-DD"
                {...register("orderDate")}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Delivery Date</Label>
              <Input
                className="border-neutral-200 bg-white"
                placeholder="YYYY-MM-DD"
                {...register("deliveryDate")}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Total Amount</Label>
              <Input
                className="border-neutral-200 bg-white"
                {...register("totalAmount")}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Delivery Fee</Label>
              <Input
                type="number"
                step="0.01"
                className="border-neutral-200 bg-white"
                {...register("deliveryFee", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Currency</Label>
              <Input
                className="border-neutral-200 bg-white"
                placeholder="USD"
                {...register("currency")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Shipping Details</Label>
            <Input
              className="border-neutral-200 bg-white"
              {...register("shippingDetails")}
            />
          </div>

          <Separator className="bg-neutral-200" />

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Extracted Items</Label>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => append({ product: "", quantity: 1 })}
                className="text-neutral-500 hover:text-black"
              >
                <Plus size={14} /> Add item
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="space-y-1">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Product / item name"
                      className={cn(
                        "border-neutral-200 bg-white text-sm",
                        errors.items?.[index]?.product && "border-destructive",
                      )}
                      {...register(`items.${index}.product`)}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="Qty"
                      min={1}
                      className={cn(
                        "border-neutral-200 bg-white text-sm",
                        errors.items?.[index]?.quantity && "border-destructive",
                      )}
                      {...register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => remove(index)}
                      className="hover:text-destructive mt-1 text-neutral-400"
                    >
                      <Trash size={14} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Notes</Label>
            <Input
              className="border-neutral-200 bg-white"
              {...register("notes")}
            />
          </div>

          <Separator className="bg-neutral-200" />

          {/* PO Matching — Auto-fill target */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Select Purchase Order to Auto-fill
            </Label>
            <div className="relative">
              <MagnifyingGlass
                size={14}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400"
              />
              <Input
                placeholder="Search by PO number or supplier…"
                className="border-neutral-200 bg-white pl-8"
                value={poSearchQuery}
                onChange={(e) => setPoSearchQuery(e.target.value)}
              />
            </div>

            <div className="max-h-40 space-y-1 overflow-y-auto">
              {filteredPOs?.map((po) => (
                <button
                  key={po._id}
                  type="button"
                  onClick={() =>
                    setManualPoId(selectedPoId === po._id ? null : po._id)
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
                      {manualPoId === po._id
                        ? "Selected"
                        : autoMatchStrategy === "trackingNumber"
                          ? "Matched by Tracking #"
                          : "Matched by PO #"}
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
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-neutral-200"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-neutral-200 text-neutral-600"
              onClick={handleSubmit(handleSaveOnly)}
            >
              <FloppyDisk size={16} />
              Save Only
            </Button>
            <Button
              type="button"
              disabled={!selectedPoId}
              className="bg-black text-white hover:bg-neutral-800"
              onClick={handleSubmit(handleConfirmAndAutoFill)}
            >
              <LinkSimple size={16} weight="bold" />
              Auto-fill PO
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
