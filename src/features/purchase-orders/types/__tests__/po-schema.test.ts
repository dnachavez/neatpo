import { describe, expect, it } from "vitest";
import { createPoSchema } from "../po-schema";

const validData = {
  poNumber: "PO-2026-001",
  supplier: "Acme Corp",
  orderDate: new Date("2026-03-15"),
  expectedDeliveryDate: new Date("2026-03-25"),
  items: [
    { product: "Widget A", quantity: 10 },
    { product: "Widget B", quantity: 5 },
  ],
};

describe("createPoSchema", () => {
  it("accepts valid purchase order data", () => {
    const result = createPoSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts when expectedDeliveryDate equals orderDate", () => {
    const data = {
      ...validData,
      expectedDeliveryDate: new Date("2026-03-15"),
    };
    const result = createPoSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects an empty PO number", () => {
    const data = { ...validData, poNumber: "" };
    const result = createPoSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "poNumber");
      expect(issue).toBeDefined();
    }
  });

  it("rejects an empty supplier name", () => {
    const data = { ...validData, supplier: "" };
    const result = createPoSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects an empty items array", () => {
    const data = { ...validData, items: [] };
    const result = createPoSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects items with quantity less than 1", () => {
    const data = {
      ...validData,
      items: [{ product: "Widget", quantity: 0 }],
    };
    const result = createPoSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects items with negative quantity", () => {
    const data = {
      ...validData,
      items: [{ product: "Widget", quantity: -3 }],
    };
    const result = createPoSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects items with non-integer quantity", () => {
    const data = {
      ...validData,
      items: [{ product: "Widget", quantity: 2.5 }],
    };
    const result = createPoSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects items with empty product name", () => {
    const data = {
      ...validData,
      items: [{ product: "", quantity: 1 }],
    };
    const result = createPoSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects when expectedDeliveryDate is before orderDate", () => {
    const data = {
      ...validData,
      orderDate: new Date("2026-03-20"),
      expectedDeliveryDate: new Date("2026-03-15"),
    };
    const result = createPoSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "expectedDeliveryDate",
      );
      expect(issue).toBeDefined();
    }
  });

  it("rejects when orderDate is missing", () => {
    const data = { ...validData, orderDate: undefined };
    const result = createPoSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects when expectedDeliveryDate is missing", () => {
    const data = { ...validData, expectedDeliveryDate: undefined };
    const result = createPoSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
