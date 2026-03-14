import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    role: v.union(v.literal("admin"), v.literal("staff")),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  purchaseOrders: defineTable({
    poNumber: v.string(),
    supplier: v.string(),
    items: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
      })
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("processing"),
      v.literal("completed")
    ),
    totalAmount: v.number(),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_poNumber", ["poNumber"]),

  documents: defineTable({
    filename: v.string(),
    fileStorageId: v.optional(v.string()),
    mimeType: v.string(),
    status: v.union(
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("extracted"),
      v.literal("matched")
    ),
    purchaseOrderId: v.optional(v.id("purchaseOrders")),
    userId: v.id("users"),
    uploadedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_purchaseOrder", ["purchaseOrderId"]),

  ocrResults: defineTable({
    documentId: v.id("documents"),
    extractedData: v.string(),
    confidence: v.number(),
    processedAt: v.number(),
  }).index("by_document", ["documentId"]),
});
