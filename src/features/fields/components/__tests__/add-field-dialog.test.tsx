import { describe, expect, it } from "vitest";
import { fieldSchema } from "../add-field-dialog";

describe("fieldSchema", () => {
  it("accepts a valid field configuration", () => {
    const result = fieldSchema.safeParse({
      label: "Order Date",
      key: "orderDate",
      type: "date",
      required: true,
      width: "full",
    });
    expect(result.success).toBe(true);
  });

  it("accepts half-width string field", () => {
    const result = fieldSchema.safeParse({
      label: "Notes",
      key: "notes",
      type: "string",
      required: false,
      width: "half",
    });
    expect(result.success).toBe(true);
  });

  it("accepts number type", () => {
    const result = fieldSchema.safeParse({
      label: "Quantity",
      key: "qty",
      type: "number",
      required: true,
      width: "full",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty label", () => {
    const result = fieldSchema.safeParse({
      label: "",
      key: "test",
      type: "string",
      required: false,
      width: "full",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty key", () => {
    const result = fieldSchema.safeParse({
      label: "Test",
      key: "",
      type: "string",
      required: false,
      width: "full",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = fieldSchema.safeParse({
      label: "Test",
      key: "test",
      type: "boolean",
      required: false,
      width: "full",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid width", () => {
    const result = fieldSchema.safeParse({
      label: "Test",
      key: "test",
      type: "string",
      required: false,
      width: "quarter",
    });
    expect(result.success).toBe(false);
  });
});
