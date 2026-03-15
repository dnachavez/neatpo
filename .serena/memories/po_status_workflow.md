# PO Status Workflow

## Statuses
- **draft** → initial status on PO creation
- **processing** → auto-set when first document is matched via `matchToPO`
- **completed** → manually set by user

## Auto-Transition
- `documents.matchToPO` mutation auto-advances PO from `draft` → `processing` when a document is linked
- POs already in `processing` or `completed` are not regressed

## Manual Override
- `purchase-orders-table.tsx` has a three-dot dropdown menu with a single sub-menu:
  - **Status** (ArrowsClockwise icon) → sub-menu with Draft/Processing/Completed badges

## Status Badge Colors (unified across all components)
- Draft: amber (`border-amber-200 bg-amber-50 text-amber-700`)
- Processing: blue (`border-blue-200 bg-blue-50 text-blue-700`)
- Completed: emerald (`border-emerald-200 bg-emerald-50 text-emerald-700`)

## Auto-Matching Strategies
- **PO Number Match**: Matches extracted PO number from OCR to existing PO records
- **Tracking Number Match**: Matches extracted tracking number to PO tracking numbers
- Logic lives in `src/features/documents/lib/auto-match.ts` (`findAutoMatch` function)

## Key Files
- `convex/documents.ts` — `matchToPO` mutation with auto-transition
- `convex/purchaseOrders.ts` — `updateStatus` mutation for manual override, `analytics` query
- `src/features/purchase-orders/components/purchase-orders-table.tsx` — PO table with status sub-menu
- `src/features/documents/lib/auto-match.ts` — Auto-matching logic
- `src/features/documents/components/ocr-review-dialog.tsx` — OCR review and PO auto-fill
