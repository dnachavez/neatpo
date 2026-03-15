import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("purchaseOrders").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("purchaseOrders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listByStatus = query({
  args: {
    status: v.union(
      v.literal("draft"),
      v.literal("processing"),
      v.literal("completed"),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("purchaseOrders")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

export const searchByPoNumber = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("purchaseOrders").collect();
    const q = args.query.toLowerCase();
    return all.filter((po) => po.poNumber.toLowerCase().includes(q));
  },
});

export const searchByTrackingNumber = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("purchaseOrders").collect();
    const q = args.query.toLowerCase();
    return all.filter((po) => po.trackingNumber?.toLowerCase().includes(q));
  },
});

export const create = mutation({
  args: {
    poNumber: v.string(),
    supplier: v.string(),
    orderDate: v.number(),
    expectedDeliveryDate: v.number(),
    items: v.array(
      v.object({
        product: v.string(),
        quantity: v.number(),
      }),
    ),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("purchaseOrders")
      .withIndex("by_poNumber", (q) => q.eq("poNumber", args.poNumber))
      .first();

    if (existing) {
      throw new ConvexError(
        `Purchase order number "${args.poNumber}" already exists.`,
      );
    }

    return await ctx.db.insert("purchaseOrders", {
      ...args,
      status: "draft",
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("purchaseOrders"),
    supplier: v.optional(v.string()),
    orderDate: v.optional(v.number()),
    expectedDeliveryDate: v.optional(v.number()),
    items: v.optional(
      v.array(
        v.object({
          product: v.string(),
          quantity: v.number(),
        }),
      ),
    ),
    totalAmount: v.optional(v.string()),
    currency: v.optional(v.string()),
    shippingDetails: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(id, updates);
    }
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("purchaseOrders"),
    status: v.union(
      v.literal("draft"),
      v.literal("processing"),
      v.literal("completed"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});
