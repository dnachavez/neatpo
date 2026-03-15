import { describe, expect, it } from "vitest";
import { extractedDataSchema } from "../document-schema";

const validData = {
  documentType: "invoice",
  trackingNumber: "TRK-12345",
  poNumber: "PO-2026-001",
  vendorName: "Acme Corp",
  items: [
    { product: "Widget A", quantity: 10 },
    { product: "Widget B", quantity: 5 },
  ],
  shippingDetails: "DHL Express",
  orderDate: "2026-03-01",
  deliveryDate: "2026-03-10",
  totalAmount: "1500.00",
  currency: "USD",
  notes: "Urgent order",
};

describe("extractedDataSchema", () => {
  it("accepts a fully populated extracted data object", () => {
    const result = extractedDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts when all nullable fields are null", () => {
    const data = {
      documentType: null,
      trackingNumber: null,
      poNumber: null,
      vendorName: null,
      items: [],
      shippingDetails: null,
      orderDate: null,
      deliveryDate: null,
      totalAmount: null,
      currency: null,
      notes: null,
    };
    const result = extractedDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts an empty items array", () => {
    const data = { ...validData, items: [] };
    const result = extractedDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects when the items field is missing entirely", () => {
    const { items: _, ...rest } = validData;
    const result = extractedDataSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an item with an empty product name", () => {
    const data = { ...validData, items: [{ product: "", quantity: 1 }] };
    const result = extractedDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects an item with quantity less than 1", () => {
    const data = { ...validData, items: [{ product: "Widget", quantity: 0 }] };
    const result = extractedDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("strips unknown extra fields", () => {
    const data = { ...validData, unknownField: "should be stripped" };
    const result = extractedDataSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect("unknownField" in result.data).toBe(false);
    }
  });
});
