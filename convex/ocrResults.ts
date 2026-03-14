import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const create = internalMutation({
  args: {
    documentId: v.id("documents"),
    extractedData: v.string(),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ocrResults", {
      ...args,
      processedAt: Date.now(),
    });
  },
});
