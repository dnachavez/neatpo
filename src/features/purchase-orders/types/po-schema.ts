import { z } from "zod";

const poItemSchema = z.object({
  description: z.string().min(1, "Item description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
});

export const createPoSchema = z.object({
  poNumber: z.string().min(1, "PO number is required"),
  supplier: z.string().min(1, "Supplier name is required"),
  items: z.array(poItemSchema).min(1, "At least one item is required"),
});

export type CreatePoFormData = z.infer<typeof createPoSchema>;
export type PoItemFormData = z.infer<typeof poItemSchema>;
