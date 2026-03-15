import { describe, expect, it } from "vitest";
import { findAutoMatch } from "../auto-match";
import type { MatchablePO, MatchableExtractedData } from "../auto-match";

const samplePOs: MatchablePO[] = [
  { _id: "po-1", poNumber: "PO-001", trackingNumber: "TRK-AAA" },
  { _id: "po-2", poNumber: "PO-002", trackingNumber: "TRK-BBB" },
  { _id: "po-3", poNumber: "PO-003", trackingNumber: null },
  { _id: "po-4", poNumber: "PO-004" }, // trackingNumber absent
];

describe("findAutoMatch", () => {
  it("matches by exact PO number", () => {
    const data: MatchableExtractedData = { poNumber: "PO-001", trackingNumber: null };
    const result = findAutoMatch(data, samplePOs);
    expect(result).toEqual({ purchaseOrderId: "po-1", strategy: "poNumber" });
  });

  it("matches by PO number case-insensitively", () => {
    const data: MatchableExtractedData = { poNumber: "po-002", trackingNumber: null };
    const result = findAutoMatch(data, samplePOs);
    expect(result).toEqual({ purchaseOrderId: "po-2", strategy: "poNumber" });
  });

  it("matches by exact tracking number when no PO number match", () => {
    const data: MatchableExtractedData = { poNumber: null, trackingNumber: "TRK-BBB" };
    const result = findAutoMatch(data, samplePOs);
    expect(result).toEqual({ purchaseOrderId: "po-2", strategy: "trackingNumber" });
  });

  it("matches by tracking number case-insensitively", () => {
    const data: MatchableExtractedData = { poNumber: null, trackingNumber: "trk-aaa" };
    const result = findAutoMatch(data, samplePOs);
    expect(result).toEqual({ purchaseOrderId: "po-1", strategy: "trackingNumber" });
  });

  it("PO number match takes priority over tracking number match", () => {
    // poNumber matches po-1, trackingNumber matches po-2
    const data: MatchableExtractedData = { poNumber: "PO-001", trackingNumber: "TRK-BBB" };
    const result = findAutoMatch(data, samplePOs);
    expect(result).toEqual({ purchaseOrderId: "po-1", strategy: "poNumber" });
  });

  it("returns null when both fields are null", () => {
    const data: MatchableExtractedData = { poNumber: null, trackingNumber: null };
    expect(findAutoMatch(data, samplePOs)).toBeNull();
  });

  it("returns null when PO list is empty", () => {
    const data: MatchableExtractedData = { poNumber: "PO-001", trackingNumber: "TRK-AAA" };
    expect(findAutoMatch(data, [])).toBeNull();
  });

  it("returns null when nothing matches", () => {
    const data: MatchableExtractedData = { poNumber: "PO-UNKNOWN", trackingNumber: "TRK-UNKNOWN" };
    expect(findAutoMatch(data, samplePOs)).toBeNull();
  });
});
