import { describe, expect, it } from "vitest";
import { extractedDataSchema, extractedItemSchema } from "../document-schema";

describe("extractedItemSchema", () => {
  it("accepts a valid item", () => {
    const result = extractedItemSchema.safeParse({
      product: "Widget",
      quantity: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty product name", () => {
    const result = extractedItemSchema.safeParse({
      product: "",
      quantity: 5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects quantity less than 1", () => {
    const result = extractedItemSchema.safeParse({
      product: "Widget",
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });
});

function validExtractedData() {
  return {
    documentType: "invoice",
    trackingNumber: "TRK-123",
    poNumber: "PO-001",
    vendorName: "Acme Corp",
    items: [{ product: "Widget", quantity: 10 }],
    shippingDetails: "Express",
    orderDate: "2025-01-01",
    deliveryDate: "2025-01-15",
    totalAmount: "1500.00",
    deliveryFee: 25,
    currency: "USD",
    notes: "Handle with care",
  };
}

describe("extractedDataSchema", () => {
  it("accepts fully populated data", () => {
    const result = extractedDataSchema.safeParse(validExtractedData());
    expect(result.success).toBe(true);
  });

  it("accepts data with all nullable fields set to null", () => {
    const result = extractedDataSchema.safeParse({
      documentType: null,
      trackingNumber: null,
      poNumber: null,
      vendorName: null,
      items: [],
      shippingDetails: null,
      orderDate: null,
      deliveryDate: null,
      totalAmount: null,
      deliveryFee: null,
      currency: null,
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid item in items array", () => {
    const result = extractedDataSchema.safeParse({
      ...validExtractedData(),
      items: [{ product: "", quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing items field", () => {
    const data = validExtractedData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (data as any).items;
    const result = extractedDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
