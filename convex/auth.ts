import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      return { success: false as const, error: "Invalid email or password" };
    }

    // Simple password check against the stored hash placeholder
    // In production, use bcrypt.compare or similar
    const isValid =
      user.passwordHash === `$2b$10$placeholder_hash_for_${args.password}`;

    if (!isValid) {
      return { success: false as const, error: "Invalid email or password" };
    }

    return {
      success: true as const,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },
});
