import { v } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
} from "./_generated/server";

export const list = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vendors")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getById = query({
  args: {
    id: v.id("vendors"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const search = query({
  args: {
    userId: v.id("users"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("vendors")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (!args.query) return all;

    const lower = args.query.toLowerCase();
    return all.filter((v) => v.name.toLowerCase().includes(lower));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check for existing vendor with same name (case-insensitive)
    const existing = await ctx.db
      .query("vendors")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const duplicate = existing.find(
      (v) => v.name.toLowerCase() === args.name.toLowerCase(),
    );

    if (duplicate) {
      return duplicate._id;
    }

    return await ctx.db.insert("vendors", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Internal mutation used by OCR pipeline to auto-create vendors
export const internalGetOrCreate = internalMutation({
  args: {
    name: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Look for existing vendor with same name (case-insensitive)
    const existing = await ctx.db
      .query("vendors")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const match = existing.find(
      (v) => v.name.toLowerCase() === args.name.trim().toLowerCase(),
    );

    if (match) {
      return match._id;
    }

    // Create new vendor
    return await ctx.db.insert("vendors", {
      name: args.name.trim(),
      userId: args.userId,
      createdAt: Date.now(),
    });
  },
});
