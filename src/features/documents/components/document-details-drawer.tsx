"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as XLSX from "xlsx";
import {
  MagnifyingGlass,
  LinkSimple,
  FloppyDisk,
  Plus,
  Trash,
  FileText,
  Image as ImageIcon,
  CircleNotch,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

interface DocumentDetailsDrawerProps {
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

function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function isPdfMimeType(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

function isSpreadsheetType(mimeType: string, filename: string): boolean {
  const spreadsheetMimes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
    "application/csv",
  ];
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return (
    spreadsheetMimes.includes(mimeType) ||
    ["xlsx", "xls", "csv"].includes(ext)
  );
}

function isTextType(mimeType: string, filename: string): boolean {
  if (mimeType.startsWith("text/") && mimeType !== "text/csv") return true;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ["json", "xml", "log", "md", "txt"].includes(ext);
}

export function DocumentDetailsDrawer({
  documentId,
  open,
  onOpenChange,
}: DocumentDetailsDrawerProps) {
  const document = useQuery(api.documents.getById, { id: documentId });
  const purchaseOrders = useQuery(api.purchaseOrders.list);
  const updateExtractedData = useMutation(api.documents.updateExtractedData);
  const matchToPO = useMutation(api.documents.matchToPO);
  const updatePO = useMutation(api.purchaseOrders.update);
  const convex = useConvex();

  const [manualPoId, setManualPoId] = useState<Id<"purchaseOrders"> | null>(
    null,
  );
  const [poSearchQuery, setPoSearchQuery] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [spreadsheetHtml, setSpreadsheetHtml] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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

  // Fetch the file URL and parse for preview
  useEffect(() => {
    if (document?.fileStorageId && open) {
      setSpreadsheetHtml(null);
      setTextContent(null);
      setPreviewLoading(true);

      convex
        .query(api.documents.getUrl, { storageId: document.fileStorageId })
        .then(async (url) => {
          setFileUrl(url);
          if (!url || !document) return;

          const mime = document.mimeType;
          const fname = document.filename;

          if (isSpreadsheetType(mime, fname)) {
            try {
              const resp = await fetch(url);
              const arrayBuffer = await resp.arrayBuffer();
              const workbook = XLSX.read(arrayBuffer, { type: "array" });

              const sheetsHtml = workbook.SheetNames.map((name) => {
                const sheet = workbook.Sheets[name];
                const html = XLSX.utils.sheet_to_html(sheet, {
                  id: `sheet-${name}`,
                });
                return `<div class="sheet-section"><h3 class="sheet-name">${name}</h3>${html}</div>`;
              }).join("");

              setSpreadsheetHtml(sheetsHtml);
            } catch {
              setSpreadsheetHtml(null);
            }
          } else if (isTextType(mime, fname)) {
            try {
              const resp = await fetch(url);
              const text = await resp.text();
              setTextContent(text);
            } catch {
              setTextContent(null);
            }
          }
        })
        .catch(() => setFileUrl(null))
        .finally(() => setPreviewLoading(false));
    }
  }, [document?.fileStorageId, open, convex, document]);

  // Parse extractedData — may be single object or array (multi-PO)
  const parsedExtractedData = (() => {
    if (!document?.extractedData) return null;
    try {
      const raw = JSON.parse(document.extractedData);
      // Multi-PO: array of PO objects
      if (Array.isArray(raw)) {
        return { isMultiPO: true as const, items: raw, first: raw[0] || null };
      }
      // Single object
      return { isMultiPO: false as const, items: [raw], first: raw };
    } catch {
      return null;
    }
  })();

  const multiPOCount = parsedExtractedData?.items.length ?? 0;

  // Auto-match PO from extracted data (uses first PO's data)
  const autoMatchResult = (() => {
    if (!parsedExtractedData?.first || !purchaseOrders) return null;
    try {
      const parsed = extractedDataSchema.parse(parsedExtractedData.first);
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

  // Parse extracted data and populate form (uses first PO's data)
  useEffect(() => {
    if (parsedExtractedData?.first) {
      try {
        const parsed = extractedDataSchema.parse(parsedExtractedData.first);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?.extractedData, reset]);

  const filteredPOs = purchaseOrders?.filter(
    (po) =>
      po.poNumber.toLowerCase().includes(poSearchQuery.toLowerCase()) ||
      po.supplier.toLowerCase().includes(poSearchQuery.toLowerCase()),
  );

  const hasExtractedData =
    document?.status === "extracted" || document?.status === "matched";

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

      await matchToPO({
        id: documentId,
        purchaseOrderId: selectedPoId,
      });

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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Auto-fill failed";
      toast.error("Failed to auto-fill", { description: message });
    }
  }

  if (!document) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-hidden sm:max-w-xl lg:max-w-2xl"
      >
        <SheetHeader className="shrink-0 border-b border-neutral-200 pb-3">
          <SheetTitle className="font-serif text-lg font-normal tracking-tight">
            {document.filename}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2 text-xs text-neutral-400">
            <Badge variant="outline" className="text-[10px]">
              {documentTypeLabels[documentType] ?? "Other"}
            </Badge>
            {document.status === "matched" && (
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
              >
                Matched
              </Badge>
            )}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="preview" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-4 mt-2 w-fit">
            <TabsTrigger value="preview">Document</TabsTrigger>
            {hasExtractedData && (
              <TabsTrigger value="extracted">Extracted Data</TabsTrigger>
            )}
          </TabsList>

          {/* Document Preview Tab */}
          <TabsContent
            value="preview"
            className="min-h-0 flex-1 overflow-auto p-4"
          >
            {previewLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
                <CircleNotch size={32} className="mb-3 animate-spin" />
                <p className="text-sm">Loading preview…</p>
              </div>
            ) : spreadsheetHtml ? (
              <div
                className="spreadsheet-preview overflow-auto rounded-md border border-neutral-200"
                dangerouslySetInnerHTML={{ __html: spreadsheetHtml }}
              />
            ) : textContent !== null ? (
              <pre className="overflow-auto whitespace-pre-wrap rounded-md border border-neutral-200 bg-neutral-50 p-4 font-mono text-xs text-neutral-700">
                {textContent}
              </pre>
            ) : fileUrl ? (
              <div className="flex h-full flex-col items-center justify-center">
                {isImageMimeType(document.mimeType) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fileUrl}
                    alt={document.filename}
                    className="max-h-full max-w-full rounded-md border border-neutral-200 object-contain"
                  />
                ) : isPdfMimeType(document.mimeType) ? (
                  <iframe
                    src={fileUrl}
                    title={document.filename}
                    className="h-full w-full rounded-md border border-neutral-200"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 py-16 text-neutral-400">
                    <FileText size={48} weight="thin" />
                    <p className="text-sm">
                      Preview not available for this file type
                    </p>
                    <Button
                      variant="outline"
                      className="border-neutral-200"
                      onClick={() => window.open(fileUrl, "_blank")}
                    >
                      Open in new tab
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
                <ImageIcon size={48} weight="thin" className="mb-3" />
                <p className="text-sm">Loading preview…</p>
              </div>
            )}
          </TabsContent>

          {/* Extracted Data Tab */}
          {hasExtractedData && (
            <TabsContent
              value="extracted"
              className="min-h-0 flex-1 overflow-auto p-4"
            >
              {parsedExtractedData?.isMultiPO && multiPOCount > 1 && (
                <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                  <p className="text-xs font-medium text-blue-700">
                    {multiPOCount} purchase orders extracted from this document.
                    POs and vendors were auto-created.
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {parsedExtractedData.items.map((po, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="border-blue-200 bg-white text-[10px] text-blue-700"
                      >
                        {(po as Record<string, unknown>).poNumber as string || `PO ${i + 1}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <form className="space-y-4">
                {/* Key fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-neutral-500">
                      Tracking Number
                    </Label>
                    <Input
                      className="h-8 border-neutral-200 bg-white text-sm"
                      {...register("trackingNumber")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-neutral-500">
                      PO Number
                    </Label>
                    <Input
                      className="h-8 border-neutral-200 bg-white text-sm"
                      {...register("poNumber")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-neutral-500">
                      Vendor Name
                    </Label>
                    <Input
                      className="h-8 border-neutral-200 bg-white text-sm"
                      {...register("vendorName")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-neutral-500">
                      Document Type
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      {documentTypeLabels[documentType] ?? "Other"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-neutral-500">
                      Order Date
                    </Label>
                    <Input
                      className="h-8 border-neutral-200 bg-white text-sm"
                      placeholder="YYYY-MM-DD"
                      {...register("orderDate")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-neutral-500">
                      Delivery Date
                    </Label>
                    <Input
                      className="h-8 border-neutral-200 bg-white text-sm"
                      placeholder="YYYY-MM-DD"
                      {...register("deliveryDate")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-neutral-500">
                      Total Amount
                    </Label>
                    <Input
                      className="h-8 border-neutral-200 bg-white text-sm"
                      {...register("totalAmount")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-neutral-500">
                      Delivery Fee
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="h-8 border-neutral-200 bg-white text-sm"
                      {...register("deliveryFee", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-neutral-500">
                      Currency
                    </Label>
                    <Input
                      className="h-8 border-neutral-200 bg-white text-sm"
                      placeholder="USD"
                      {...register("currency")}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-neutral-500">
                    Shipping Details
                  </Label>
                  <Input
                    className="h-8 border-neutral-200 bg-white text-sm"
                    {...register("shippingDetails")}
                  />
                </div>

                <Separator className="bg-neutral-200" />

                {/* Line Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-neutral-500">
                      Extracted Items
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => append({ product: "", quantity: 1 })}
                      className="text-neutral-500 hover:text-black"
                    >
                      <Plus size={12} /> Add
                    </Button>
                  </div>

                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Product"
                          className={cn(
                            "h-8 border-neutral-200 bg-white text-sm",
                            errors.items?.[index]?.product &&
                              "border-destructive",
                          )}
                          {...register(`items.${index}.product`)}
                        />
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          placeholder="Qty"
                          min={1}
                          className={cn(
                            "h-8 border-neutral-200 bg-white text-sm",
                            errors.items?.[index]?.quantity &&
                              "border-destructive",
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
                          className="hover:text-destructive mt-0.5 text-neutral-400"
                        >
                          <Trash size={12} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-neutral-500">
                    Notes
                  </Label>
                  <Input
                    className="h-8 border-neutral-200 bg-white text-sm"
                    {...register("notes")}
                  />
                </div>

                <Separator className="bg-neutral-200" />

                {/* PO Matching */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-neutral-500">
                    Link to Purchase Order
                  </Label>
                  <div className="relative">
                    <MagnifyingGlass
                      size={12}
                      className="absolute top-1/2 left-2.5 -translate-y-1/2 text-neutral-400"
                    />
                    <Input
                      placeholder="Search by PO number or supplier…"
                      className="h-8 border-neutral-200 bg-white pl-7 text-sm"
                      value={poSearchQuery}
                      onChange={(e) => setPoSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="max-h-32 space-y-1 overflow-y-auto">
                    {filteredPOs?.map((po) => (
                      <button
                        key={po._id}
                        type="button"
                        onClick={() =>
                          setManualPoId(
                            selectedPoId === po._id ? null : po._id,
                          )
                        }
                        className={cn(
                          "flex w-full items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
                          selectedPoId === po._id
                            ? "border-black bg-neutral-50 text-black"
                            : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
                        )}
                      >
                        <div>
                          <span className="font-medium">{po.poNumber}</span>
                          <span className="ml-2 text-neutral-400">
                            {po.supplier}
                          </span>
                        </div>
                        {selectedPoId === po._id && (
                          <Badge variant="default" className="text-[9px]">
                            {manualPoId === po._id
                              ? "Selected"
                              : autoMatchStrategy === "trackingNumber"
                                ? "Tracking #"
                                : "PO #"}
                          </Badge>
                        )}
                      </button>
                    ))}
                    {filteredPOs?.length === 0 && (
                      <p className="py-3 text-center text-xs text-neutral-400">
                        No purchase orders found
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 border-neutral-200 text-xs text-neutral-600"
                    onClick={handleSubmit(handleSaveOnly)}
                  >
                    <FloppyDisk size={14} />
                    Save
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!selectedPoId}
                    className="flex-1 bg-black text-xs text-white hover:bg-neutral-800"
                    onClick={handleSubmit(handleConfirmAndAutoFill)}
                  >
                    <LinkSimple size={14} weight="bold" />
                    Auto-fill PO
                  </Button>
                </div>
              </form>
            </TabsContent>
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
