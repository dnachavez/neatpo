import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").order("desc").collect();

    const documentsWithPo = await Promise.all(
      documents.map(async (doc) => {
        let matchedPoNumber: string | null = null;
        if (doc.purchaseOrderId) {
          const po = await ctx.db.get(doc.purchaseOrderId);
          matchedPoNumber = po?.poNumber ?? null;
        }
        return { ...doc, matchedPoNumber };
      }),
    );

    return documentsWithPo;
  },
});

export const listPaginated = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("documents")
      .order("desc")
      .paginate(args.paginationOpts);

    const pageWithPo = await Promise.all(
      result.page.map(async (doc) => {
        let matchedPoNumber: string | null = null;
        if (doc.purchaseOrderId) {
          const po = await ctx.db.get(doc.purchaseOrderId);
          matchedPoNumber = po?.poNumber ?? null;
        }
        return { ...doc, matchedPoNumber };
      }),
    );

    return {
      ...result,
      page: pageWithPo,
    };
  },
});

export const getById = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listByStatus = query({
  args: {
    status: v.union(
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("extracted"),
      v.literal("matched"),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

export const listByPurchaseOrder = query({
  args: { purchaseOrderId: v.id("purchaseOrders") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_purchaseOrder", (q) =>
        q.eq("purchaseOrderId", args.purchaseOrderId),
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    filename: v.string(),
    fileStorageId: v.string(),
    mimeType: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("documents", {
      ...args,
      status: "uploaded",
      uploadedAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("documents"),
    status: v.union(
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("extracted"),
      v.literal("matched"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const updateExtractedData = mutation({
  args: {
    id: v.id("documents"),
    extractedData: v.string(),
    documentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      extractedData: args.extractedData,
      documentType: args.documentType,
      status: "extracted",
    });
  },
});

export const matchToPO = mutation({
  args: {
    id: v.id("documents"),
    purchaseOrderId: v.id("purchaseOrders"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      purchaseOrderId: args.purchaseOrderId,
      status: "matched",
    });

    // Auto-advance PO status: draft → processing
    const po = await ctx.db.get(args.purchaseOrderId);
    if (po && po.status === "draft") {
      await ctx.db.patch(args.purchaseOrderId, { status: "processing" });
    }
  },
});

export const countByStatus = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("documents").collect();
    const counts = {
      uploaded: 0,
      processing: 0,
      extracted: 0,
      matched: 0,
      total: all.length,
    };
    for (const doc of all) {
      counts[doc.status]++;
    }
    return counts;
  },
});

export const listProcessing = query({
  args: {},
  handler: async (ctx) => {
    const uploaded = await ctx.db
      .query("documents")
      .withIndex("by_status", (q) => q.eq("status", "uploaded"))
      .order("desc")
      .collect();
    const processing = await ctx.db
      .query("documents")
      .withIndex("by_status", (q) => q.eq("status", "processing"))
      .order("desc")
      .collect();
    return [...processing, ...uploaded];
  },
});

// Internal mutations used by OCR action
export const internalUpdateStatus = internalMutation({
  args: {
    id: v.id("documents"),
    status: v.union(
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("extracted"),
      v.literal("matched"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const internalUpdateExtractedData = internalMutation({
  args: {
    id: v.id("documents"),
    extractedData: v.string(),
    documentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      extractedData: args.extractedData,
      documentType: args.documentType,
      status: "extracted",
    });
  },
});

/**
 * Server-side auto-match: tries to link the document to an existing PO
 * by matching extracted PO number or tracking number.
 * Called automatically after OCR extraction succeeds.
 */
export const internalAutoMatch = internalMutation({
  args: {
    documentId: v.id("documents"),
    poNumber: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let matchedPo = null;
    let strategy: string | null = null;

    // 1. Try exact PO number match
    if (args.poNumber) {
      matchedPo = await ctx.db
        .query("purchaseOrders")
        .withIndex("by_poNumber", (q) => q.eq("poNumber", args.poNumber!))
        .first();
      if (matchedPo) strategy = "poNumber";
    }

    // 2. Try exact tracking number match
    if (!matchedPo && args.trackingNumber) {
      matchedPo = await ctx.db
        .query("purchaseOrders")
        .withIndex("by_trackingNumber", (q) =>
          q.eq("trackingNumber", args.trackingNumber!),
        )
        .first();
      if (matchedPo) strategy = "trackingNumber";
    }

    if (matchedPo) {
      // Link document to PO
      await ctx.db.patch(args.documentId, {
        purchaseOrderId: matchedPo._id,
        status: "matched",
      });

      // Auto-advance PO status: draft → processing
      if (matchedPo.status === "draft") {
        await ctx.db.patch(matchedPo._id, { status: "processing" });
      }

      return { matched: true, strategy, purchaseOrderId: matchedPo._id };
    }

    return { matched: false, strategy: null, purchaseOrderId: null };
  },
});

/**
 * Auto-create POs and vendors from extracted OCR data.
 * Called by the OCR pipeline after extraction succeeds.
 * Handles both single-doc and multi-PO spreadsheet flows.
 */
export const internalCreatePOsFromExtraction = internalMutation({
  args: {
    documentId: v.id("documents"),
    userId: v.id("users"),
    extractedPOs: v.string(), // JSON string — array of extracted PO objects
  },
  handler: async (ctx, args) => {
    let poArray: Array<Record<string, unknown>>;
    try {
      poArray = JSON.parse(args.extractedPOs);
      if (!Array.isArray(poArray)) poArray = [poArray];
    } catch {
      return { created: 0, matched: 0, skipped: 0 };
    }

    let created = 0;
    let matched = 0;
    let skipped = 0;
    let firstLinkedPoId: Id<"purchaseOrders"> | null = null;

    for (const po of poArray) {
      const poNumber = po.poNumber as string | null;
      const vendorName = po.vendorName as string | null;

      // Skip POs without a PO number — can't create without one
      if (!poNumber || poNumber.trim() === "") {
        skipped++;
        continue;
      }

      // Check if PO already exists
      const existingPo = await ctx.db
        .query("purchaseOrders")
        .withIndex("by_poNumber", (q) => q.eq("poNumber", poNumber.trim()))
        .first();

      if (existingPo) {
        // PO exists — link document to it
        if (!firstLinkedPoId) {
          firstLinkedPoId = existingPo._id;
        }
        matched++;
        continue;
      }

      // Create vendor if vendor name is provided
      let vendorId = undefined;
      if (vendorName && vendorName.trim() !== "") {
        vendorId = await ctx.runMutation(internal.vendors.internalGetOrCreate, {
          name: vendorName.trim(),
          userId: args.userId,
        });
      }

      // Parse dates
      const orderDateStr = po.orderDate as string | null;
      const deliveryDateStr = po.deliveryDate as string | null;
      const orderDate = orderDateStr
        ? new Date(orderDateStr).getTime()
        : Date.now();
      const deliveryDate = deliveryDateStr
        ? new Date(deliveryDateStr).getTime()
        : orderDate + 14 * 24 * 60 * 60 * 1000; // Default: 14 days from order

      // Parse items
      const rawItems = (po.items as Array<{ product: string; quantity: number }>) || [];
      const items = rawItems.length > 0
        ? rawItems.map((item) => ({
            product: item.product ?? "Unknown item",
            quantity: typeof item.quantity === "number" ? item.quantity : 1,
          }))
        : [{ product: "Unspecified", quantity: 1 }];

      // Create the PO
      const newPoId = await ctx.db.insert("purchaseOrders", {
        poNumber: poNumber.trim(),
        supplier: vendorName?.trim() ?? "Unknown Vendor",
        vendorId,
        orderDate: isNaN(orderDate) ? Date.now() : orderDate,
        expectedDeliveryDate: isNaN(deliveryDate) ? Date.now() + 14 * 24 * 60 * 60 * 1000 : deliveryDate,
        items,
        status: "draft",
        sourceDocumentId: args.documentId,
        userId: args.userId,
        createdAt: Date.now(),
        // Optional fields
        ...(po.totalAmount ? { totalAmount: po.totalAmount as string } : {}),
        ...(po.deliveryFee ? { deliveryFee: po.deliveryFee as number } : {}),
        ...(po.currency ? { currency: po.currency as string } : {}),
        ...(po.shippingDetails ? { shippingDetails: po.shippingDetails as string } : {}),
        ...(po.trackingNumber ? { trackingNumber: po.trackingNumber as string } : {}),
        ...(po.notes ? { notes: po.notes as string } : {}),
      });

      if (!firstLinkedPoId) {
        firstLinkedPoId = newPoId;
      }
      created++;
    }

    // Link document to the first PO (whether created or matched)
    if (firstLinkedPoId) {
      await ctx.db.patch(args.documentId, {
        purchaseOrderId: firstLinkedPoId,
        status: "matched",
      });

      // Auto-advance the first PO: draft → processing
      const firstPo = await ctx.db.get(firstLinkedPoId);
      if (firstPo && firstPo.status === "draft") {
        await ctx.db.patch(firstLinkedPoId, { status: "processing" });
      }
    }

    return { created, matched, skipped };
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Document not found");

    // Delete the file from storage
    if (doc.fileStorageId) {
      await ctx.storage.delete(doc.fileStorageId);
    }

    // Delete associated OCR results
    const ocrResults = await ctx.db
      .query("ocrResults")
      .withIndex("by_document", (q) => q.eq("documentId", args.id))
      .collect();
    for (const result of ocrResults) {
      await ctx.db.delete(result._id);
    }

    // Delete the document record
    await ctx.db.delete(args.id);
  },
});
