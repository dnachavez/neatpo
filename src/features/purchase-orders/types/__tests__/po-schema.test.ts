import { describe, expect, it } from "vitest";
import { createPoSchema } from "../po-schema";

describe("createPoSchema", () => {
  it("accepts valid purchase order data", () => {
    const validData = {
      poNumber: "PO-2026-001",
      supplier: "Acme Corp",
      items: [
        { description: "Widget A", quantity: 10, unitPrice: 25.5 },
        { description: "Widget B", quantity: 5, unitPrice: 12.0 },
      ],
    };

    const result = createPoSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  it("rejects an empty PO number", () => {
    const data = {
      poNumber: "",
      supplier: "Acme Corp",
      items: [{ description: "Widget", quantity: 1, unitPrice: 10 }],
    };

    const result = createPoSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      const poNumberError = result.error.issues.find(
        (issue) => issue.path[0] === "poNumber",
      );
      expect(poNumberError).toBeDefined();
    }
  });

  it("rejects an empty supplier name", () => {
    const data = {
      poNumber: "PO-001",
      supplier: "",
      items: [{ description: "Widget", quantity: 1, unitPrice: 10 }],
    };

    const result = createPoSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("rejects an empty items array", () => {
    const data = {
      poNumber: "PO-001",
      supplier: "Acme Corp",
      items: [],
    };

    const result = createPoSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("rejects items with quantity less than 1", () => {
    const data = {
      poNumber: "PO-001",
      supplier: "Acme Corp",
      items: [{ description: "Widget", quantity: 0, unitPrice: 10 }],
    };

    const result = createPoSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("rejects items with negative unit price", () => {
    const data = {
      poNumber: "PO-001",
      supplier: "Acme Corp",
      items: [{ description: "Widget", quantity: 1, unitPrice: -5 }],
    };

    const result = createPoSchema.safeParse(data);

    expect(result.success).toBe(false);
  });
});
