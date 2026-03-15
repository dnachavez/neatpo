import { z } from "zod";

export const extractedItemSchema = z.object({
  product: z.string().min(1, "Product name is required"),
  quantity: z
    .number({ error: "Quantity is required" })
    .min(1, "Quantity must be at least 1"),
});

export const extractedDataSchema = z.object({
  documentType: z.string().nullable(),
  trackingNumber: z.string().nullable(),
  poNumber: z.string().nullable(),
  vendorName: z.string().nullable(),
  items: z.array(extractedItemSchema),
  shippingDetails: z.string().nullable(),
  orderDate: z.string().nullable(),
  deliveryDate: z.string().nullable(),
  totalAmount: z.string().nullable(),
  deliveryFee: z.number().nullable(),
  currency: z.string().nullable(),
  notes: z.string().nullable(),
});

export type ExtractedData = z.infer<typeof extractedDataSchema>;
export type ExtractedItem = z.infer<typeof extractedItemSchema>;
