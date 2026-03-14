import { internalMutation } from "./_generated/server";

export const seedDefaultUser = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "staff@neatpo.app"))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("users", {
      name: "Supply Chain Staff",
      email: "staff@neatpo.app",
      passwordHash:
        "$2b$10$placeholder_hash_for_neatpo2026",
      role: "staff",
      createdAt: Date.now(),
    });
  },
});
