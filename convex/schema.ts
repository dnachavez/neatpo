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

  suppliers: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  purchaseOrders: defineTable({
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
    totalAmount: v.optional(v.string()),
    currency: v.optional(v.string()),
    shippingDetails: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("processing"),
      v.literal("completed"),
    ),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_poNumber", ["poNumber"])
    .index("by_trackingNumber", ["trackingNumber"]),

  documents: defineTable({
    filename: v.string(),
    fileStorageId: v.string(),
    mimeType: v.string(),
    status: v.union(
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("extracted"),
      v.literal("matched"),
    ),
    documentType: v.optional(v.string()),
    extractedData: v.optional(v.string()),
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
