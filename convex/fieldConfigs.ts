import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("fieldConfigs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()
      .then((configs) => configs.sort((a, b) => a.order - b.order));
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    label: v.string(),
    key: v.string(),
    type: v.union(
      v.literal("string"),
      v.literal("number"),
      v.literal("date"),
    ),
    required: v.boolean(),
    order: v.number(),
    width: v.union(v.literal("full"), v.literal("half")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("fieldConfigs")
      .withIndex("by_user_and_key", (q) =>
        q.eq("userId", args.userId).eq("key", args.key),
      )
      .first();

    if (existing) {
      throw new ConvexError(
        `A field with key "${args.key}" already exists.`,
      );
    }

    return await ctx.db.insert("fieldConfigs", {
      ...args,
      isDefault: false,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("fieldConfigs"),
    label: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("string"),
        v.literal("number"),
        v.literal("date"),
      ),
    ),
    required: v.optional(v.boolean()),
    order: v.optional(v.number()),
    width: v.optional(v.union(v.literal("full"), v.literal("half"))),
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

export const remove = mutation({
  args: { id: v.id("fieldConfigs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const reorder = mutation({
  args: {
    items: v.array(
      v.object({
        id: v.id("fieldConfigs"),
        order: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const item of args.items) {
      await ctx.db.patch(item.id, { order: item.order });
    }
  },
});
