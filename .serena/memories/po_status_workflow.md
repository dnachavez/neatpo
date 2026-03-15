# PO Status Workflow

## Statuses
- **draft** → initial status on PO creation
- **processing** → auto-set when first document is matched via `matchToPO`
- **completed** → manually set by user

## Auto-Transition
- `documents.matchToPO` mutation auto-advances PO from `draft` → `processing` when a document is linked
- POs already in `processing` or `completed` are not regressed

## Manual Override
- Both `purchase-orders-table.tsx` and `po-listing.tsx` have a three-dot dropdown menu with:
  - **View Details** (Eye icon) → opens `po-details-drawer.tsx`
  - **Documents** (Files icon) → opens `po-documents-drawer.tsx`
  - **Status** (ArrowsClockwise icon) → sub-menu with Draft/Processing/Completed

## Status Badge Colors (unified)
- Draft: amber (`border-amber-200 bg-amber-50 text-amber-700`)
- Processing: blue (`border-blue-200 bg-blue-50 text-blue-700`)
- Completed: emerald (`border-emerald-200 bg-emerald-50 text-emerald-700`)

## Key Files
- `convex/documents.ts` — `matchToPO` mutation with auto-transition
- `convex/purchaseOrders.ts` — `updateStatus` mutation for manual override
- `src/features/purchase-orders/components/po-details-drawer.tsx` — PO details view
- `src/features/purchase-orders/components/po-documents-drawer.tsx` — linked documents view
- `src/features/purchase-orders/components/purchase-orders-table.tsx` — PO page table
- `src/features/dashboard/components/po-listing.tsx` — Dashboard PO table
