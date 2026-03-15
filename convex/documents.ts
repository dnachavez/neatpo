import { query, mutation, internalMutation } from "./_generated/server";
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
