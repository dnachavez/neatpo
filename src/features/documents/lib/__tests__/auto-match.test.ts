import { describe, expect, it } from "vitest";
import {
  findAutoMatch,
  type MatchablePO,
  type MatchableExtractedData,
} from "../auto-match";

const purchaseOrders: MatchablePO[] = [
  { _id: "po-1", poNumber: "PO-001", trackingNumber: "TRK-AAA" },
  { _id: "po-2", poNumber: "PO-002", trackingNumber: null },
  { _id: "po-3", poNumber: "PO-003" },
];

describe("findAutoMatch", () => {
  it("matches by exact PO number", () => {
    const result = findAutoMatch({ poNumber: "PO-001" }, purchaseOrders);
    expect(result).toEqual({ purchaseOrderId: "po-1", strategy: "poNumber" });
  });

  it("matches PO number case-insensitively", () => {
    const result = findAutoMatch({ poNumber: "po-002" }, purchaseOrders);
    expect(result).toEqual({ purchaseOrderId: "po-2", strategy: "poNumber" });
  });

  it("matches by tracking number when PO number has no match", () => {
    const extracted: MatchableExtractedData = {
      poNumber: "NONEXISTENT",
      trackingNumber: "TRK-AAA",
    };
    const result = findAutoMatch(extracted, purchaseOrders);
    expect(result).toEqual({
      purchaseOrderId: "po-1",
      strategy: "trackingNumber",
    });
  });

  it("matches tracking number case-insensitively", () => {
    const result = findAutoMatch(
      { trackingNumber: "trk-aaa" },
      purchaseOrders,
    );
    expect(result).toEqual({
      purchaseOrderId: "po-1",
      strategy: "trackingNumber",
    });
  });

  it("prioritises PO number over tracking number", () => {
    const extracted: MatchableExtractedData = {
      poNumber: "PO-002",
      trackingNumber: "TRK-AAA",
    };
    const result = findAutoMatch(extracted, purchaseOrders);
    expect(result).toEqual({ purchaseOrderId: "po-2", strategy: "poNumber" });
  });

  it("returns null when no match is found", () => {
    const result = findAutoMatch(
      { poNumber: "NONE", trackingNumber: "NONE" },
      purchaseOrders,
    );
    expect(result).toBeNull();
  });

  it("returns null when extracted data is empty", () => {
    const result = findAutoMatch({}, purchaseOrders);
    expect(result).toBeNull();
  });

  it("returns null when extracted data has null fields", () => {
    const result = findAutoMatch(
      { poNumber: null, trackingNumber: null },
      purchaseOrders,
    );
    expect(result).toBeNull();
  });

  it("returns null when purchase orders list is empty", () => {
    const result = findAutoMatch({ poNumber: "PO-001" }, []);
    expect(result).toBeNull();
  });
});
