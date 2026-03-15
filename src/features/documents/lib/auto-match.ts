/**
 * Pure utility for auto-matching extracted document data against purchase orders.
 *
 * Matching priority:
 *   1. Exact PO number match (case-insensitive)
 *   2. Exact tracking number match (case-insensitive)
 */

export type MatchStrategy = "poNumber" | "trackingNumber";

export interface AutoMatchResult {
  purchaseOrderId: string;
  strategy: MatchStrategy;
}

export interface MatchablePO {
  _id: string;
  poNumber: string;
  trackingNumber?: string | null;
}

export interface MatchableExtractedData {
  poNumber?: string | null;
  trackingNumber?: string | null;
}

/**
 * Finds the best matching purchase order for the given extracted data.
 *
 * @returns The matched PO id and the strategy used, or `null` if no match.
 */
export function findAutoMatch(
  extractedData: MatchableExtractedData,
  purchaseOrders: MatchablePO[],
): AutoMatchResult | null {
  // 1. Try exact PO number match
  if (extractedData.poNumber) {
    const normalised = extractedData.poNumber.toLowerCase();
    const match = purchaseOrders.find(
      (po) => po.poNumber.toLowerCase() === normalised,
    );
    if (match) {
      return { purchaseOrderId: match._id, strategy: "poNumber" };
    }
  }

  // 2. Try exact tracking number match
  if (extractedData.trackingNumber) {
    const normalised = extractedData.trackingNumber.toLowerCase();
    const match = purchaseOrders.find(
      (po) => po.trackingNumber?.toLowerCase() === normalised,
    );
    if (match) {
      return { purchaseOrderId: match._id, strategy: "trackingNumber" };
    }
  }

  return null;
}
