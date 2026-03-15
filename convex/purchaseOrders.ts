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

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("purchaseOrders")
      .order("desc")
      .collect();
    const q = args.query.toLowerCase();
    return all.filter(
      (po) =>
        po.poNumber.toLowerCase().includes(q) ||
        po.supplier.toLowerCase().includes(q),
    );
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
    deliveryFee: v.optional(v.number()),
    totalAmount: v.optional(v.string()),
    currency: v.optional(v.string()),
    shippingDetails: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    customFields: v.optional(v.string()),
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
    deliveryFee: v.optional(v.number()),
    totalAmount: v.optional(v.string()),
    currency: v.optional(v.string()),
    shippingDetails: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    customFields: v.optional(v.string()),
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

export const analytics = query({
  args: {},
  handler: async (ctx) => {
    const allPOs = await ctx.db.query("purchaseOrders").collect();

    const totalPOs = allPOs.length;
    const byStatus = { draft: 0, processing: 0, completed: 0 };
    const bySupplier: Record<string, { count: number; totalFee: number }> = {};
    const byMonth: Record<string, number> = {};
    const byDayOfWeek: Record<number, { totalFee: number; count: number }> = {};
    let totalSpend = 0;
    let totalDeliveryFees = 0;
    let posWithFees = 0;

    for (const po of allPOs) {
      // Status breakdown
      byStatus[po.status]++;

      // Supplier breakdown
      if (!bySupplier[po.supplier]) {
        bySupplier[po.supplier] = { count: 0, totalFee: 0 };
      }
      bySupplier[po.supplier].count++;

      // Spend tracking
      if (po.totalAmount) {
        const amount = parseFloat(po.totalAmount.replace(/[^0-9.-]/g, ""));
        if (!isNaN(amount)) totalSpend += amount;
      }

      // Delivery fee tracking
      if (po.deliveryFee !== undefined && po.deliveryFee !== null) {
        totalDeliveryFees += po.deliveryFee;
        posWithFees++;
        bySupplier[po.supplier].totalFee += po.deliveryFee;

        // Day-of-week analysis (for predictions)
        const deliveryDay = new Date(po.expectedDeliveryDate).getDay();
        if (!byDayOfWeek[deliveryDay]) {
          byDayOfWeek[deliveryDay] = { totalFee: 0, count: 0 };
        }
        byDayOfWeek[deliveryDay].totalFee += po.deliveryFee;
        byDayOfWeek[deliveryDay].count++;
      }

      // Monthly breakdown
      const monthKey = new Date(po.createdAt).toISOString().slice(0, 7);
      byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
    }

    const avgDeliveryFee =
      posWithFees > 0 ? totalDeliveryFees / posWithFees : 0;

    // Day-of-week averages for predictions
    const dayOfWeekAvgFees: Record<number, number> = {};
    for (const [day, data] of Object.entries(byDayOfWeek)) {
      dayOfWeekAvgFees[Number(day)] = data.totalFee / data.count;
    }

    // Supplier averages
    const supplierAvgFees: Record<string, number> = {};
    for (const [supplier, data] of Object.entries(bySupplier)) {
      supplierAvgFees[supplier] =
        data.count > 0 ? data.totalFee / data.count : 0;
    }

    return {
      totalPOs,
      totalSpend,
      avgDeliveryFee,
      totalDeliveryFees,
      posWithFees,
      byStatus,
      bySupplier,
      byMonth,
      dayOfWeekAvgFees,
      supplierAvgFees,
    };
  },
});
