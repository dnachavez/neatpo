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

  fieldConfigs: defineTable({
    userId: v.id("users"),
    label: v.string(),
    key: v.string(),
    type: v.union(
      v.literal("string"),
      v.literal("number"),
      v.literal("date"),
      v.literal("boolean"),
      v.literal("email"),
      v.literal("phone"),
      v.literal("url"),
      v.literal("textarea"),
      v.literal("currency"),
      v.literal("select"),
      v.literal("time"),
      v.literal("datetime"),
    ),
    required: v.boolean(),
    order: v.number(),
    width: v.union(v.literal("full"), v.literal("half")),
    options: v.optional(v.array(v.string())),
    isDefault: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_key", ["userId", "key"]),

  vendors: defineTable({
    name: v.string(),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_name", ["name"]),

  purchaseOrders: defineTable({
    poNumber: v.string(),
    supplier: v.string(),
    vendorId: v.optional(v.id("vendors")),
    orderDate: v.number(),
    expectedDeliveryDate: v.number(),
    deliveryFee: v.optional(v.number()),
    totalAmount: v.optional(v.string()),
    currency: v.optional(v.string()),
    shippingDetails: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    items: v.array(
      v.object({
        product: v.string(),
        quantity: v.number(),
      }),
    ),
    customFields: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("processing"),
      v.literal("completed"),
    ),
    sourceDocumentId: v.optional(v.id("documents")),
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
