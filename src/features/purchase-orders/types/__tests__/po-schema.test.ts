import { describe, expect, it } from "vitest";
import { createPoSchema, createPoBaseSchema } from "../po-schema";

function validPoData() {
  return {
    poNumber: "PO-001",
    supplier: "Acme Corp",
    orderDate: new Date("2025-01-01"),
    expectedDeliveryDate: new Date("2025-01-15"),
    items: [{ product: "Widget", quantity: 10 }],
  };
}

describe("createPoBaseSchema", () => {
  it("accepts valid PO data", () => {
    const result = createPoBaseSchema.safeParse(validPoData());
    expect(result.success).toBe(true);
  });

  it("accepts optional deliveryFee, totalAmount, and currency", () => {
    const result = createPoBaseSchema.safeParse({
      ...validPoData(),
      deliveryFee: 25.5,
      totalAmount: "1050.00",
      currency: "USD",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing poNumber", () => {
    const data = validPoData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (data as any).poNumber;
    const result = createPoBaseSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects empty supplier", () => {
    const result = createPoBaseSchema.safeParse({
      ...validPoData(),
      supplier: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty items array", () => {
    const result = createPoBaseSchema.safeParse({
      ...validPoData(),
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects item with empty product name", () => {
    const result = createPoBaseSchema.safeParse({
      ...validPoData(),
      items: [{ product: "", quantity: 5 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects item with quantity less than 1", () => {
    const result = createPoBaseSchema.safeParse({
      ...validPoData(),
      items: [{ product: "Widget", quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects item with non-integer quantity", () => {
    const result = createPoBaseSchema.safeParse({
      ...validPoData(),
      items: [{ product: "Widget", quantity: 2.5 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("createPoSchema (with date refinement)", () => {
  it("accepts delivery date equal to order date", () => {
    const date = new Date("2025-06-01");
    const result = createPoSchema.safeParse({
      ...validPoData(),
      orderDate: date,
      expectedDeliveryDate: date,
    });
    expect(result.success).toBe(true);
  });

  it("accepts delivery date after order date", () => {
    const result = createPoSchema.safeParse(validPoData());
    expect(result.success).toBe(true);
  });

  it("rejects delivery date before order date", () => {
    const result = createPoSchema.safeParse({
      ...validPoData(),
      orderDate: new Date("2025-06-15"),
      expectedDeliveryDate: new Date("2025-06-01"),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const dateIssue = result.error.issues.find(
        (i) => Array.isArray(i.path) && i.path.includes("expectedDeliveryDate"),
      );
      expect(dateIssue).toBeDefined();
      expect(dateIssue?.message).toBe(
        "Expected delivery date must be on or after the order date",
      );
    }
  });
});
