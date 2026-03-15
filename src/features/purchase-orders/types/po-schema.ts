import { z } from "zod";

const poItemSchema = z.object({
  product: z.string().min(1, "Product name is required"),
  quantity: z
    .number({ error: "Quantity is required" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
});

export const createPoBaseSchema = z.object({
  poNumber: z.string().min(1, "PO number is required"),
  supplier: z.string().min(1, "Supplier name is required"),
  orderDate: z.date({ error: "Order date is required" }),
  expectedDeliveryDate: z.date({
    error: "Expected delivery date is required",
  }),
  items: z.array(poItemSchema).min(1, "At least one item is required"),
  deliveryFee: z.number().optional(),
  totalAmount: z.string().optional(),
  currency: z.string().optional(),
});

export const createPoSchema = createPoBaseSchema.refine(
  (data) => data.expectedDeliveryDate >= data.orderDate,
  {
    message: "Expected delivery date must be on or after the order date",
    path: ["expectedDeliveryDate"],
  },
);

export type CreatePoFormData = z.infer<typeof createPoBaseSchema>;
export type PoItemFormData = z.infer<typeof poItemSchema>;
