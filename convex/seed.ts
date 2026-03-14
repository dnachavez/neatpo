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
      passwordHash: "$2b$10$placeholder_hash_for_neatpo2026",
      role: "staff",
      createdAt: Date.now(),
    });
  },
});

const DEFAULT_SUPPLIERS = [
  "Maersk Logistics",
  "DHL Supply Chain",
  "FedEx Freight",
  "CMA CGM Group",
  "Kuehne + Nagel",
];

export const seedSuppliers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existingSuppliers = await ctx.db.query("suppliers").collect();

    if (existingSuppliers.length > 0) {
      return existingSuppliers.map((s) => s._id);
    }

    const ids = [];
    for (const name of DEFAULT_SUPPLIERS) {
      const id = await ctx.db.insert("suppliers", { name });
      ids.push(id);
    }
    return ids;
  },
});
