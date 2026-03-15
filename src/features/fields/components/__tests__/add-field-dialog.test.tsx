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

  it("accepts boolean type", () => {
    const result = fieldSchema.safeParse({
      label: "Urgent",
      key: "urgent",
      type: "boolean",
      required: false,
      width: "half",
    });
    expect(result.success).toBe(true);
  });

  it("accepts email type", () => {
    const result = fieldSchema.safeParse({
      label: "Contact Email",
      key: "contact_email",
      type: "email",
      required: true,
      width: "full",
    });
    expect(result.success).toBe(true);
  });

  it("accepts phone type", () => {
    const result = fieldSchema.safeParse({
      label: "Phone Number",
      key: "phone_number",
      type: "phone",
      required: false,
      width: "half",
    });
    expect(result.success).toBe(true);
  });

  it("accepts url type", () => {
    const result = fieldSchema.safeParse({
      label: "Website",
      key: "website",
      type: "url",
      required: false,
      width: "full",
    });
    expect(result.success).toBe(true);
  });

  it("accepts textarea type", () => {
    const result = fieldSchema.safeParse({
      label: "Description",
      key: "description",
      type: "textarea",
      required: false,
      width: "full",
    });
    expect(result.success).toBe(true);
  });

  it("accepts currency type", () => {
    const result = fieldSchema.safeParse({
      label: "Unit Price",
      key: "unit_price",
      type: "currency",
      required: true,
      width: "half",
    });
    expect(result.success).toBe(true);
  });

  it("accepts select type", () => {
    const result = fieldSchema.safeParse({
      label: "Priority",
      key: "priority",
      type: "select",
      required: true,
      width: "half",
    });
    expect(result.success).toBe(true);
  });

  it("accepts time type", () => {
    const result = fieldSchema.safeParse({
      label: "Pickup Time",
      key: "pickup_time",
      type: "time",
      required: false,
      width: "half",
    });
    expect(result.success).toBe(true);
  });

  it("accepts datetime type", () => {
    const result = fieldSchema.safeParse({
      label: "Arrival Date & Time",
      key: "arrival_datetime",
      type: "datetime",
      required: false,
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
      type: "matrix",
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
