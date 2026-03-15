# OCR & Document Processing Pipeline

## Flow
1. **Upload**: User uploads any document (no file type restrictions, 10MB max) via `upload-zone.tsx` or captures via `camera-capture.tsx`
2. **Storage**: File is stored in Convex file storage via `documents.generateUploadUrl` + `documents.create`
3. **Processing**: `ocr.processDocument` action is triggered (receives `userId` for auto-creation)
   - Sets document status to `"processing"`
   - Fetches file from Convex storage
   - **Spreadsheets**: Converts to CSV text, uses `GEMINI_MULTI_PO_RESPONSE_SCHEMA` (array response) and `SPREADSHEET_EXTRACTION_PROMPT` to extract **multiple POs** from a single spreadsheet
   - **Other docs**: Converts to base64, uses `GEMINI_RESPONSE_SCHEMA` (single object) and `EXTRACTION_PROMPT`
   - Parses the structured JSON response
   - Saves OCR result via `ocrResults.create`
   - Updates document with extracted data via `documents.internalUpdateExtractedData`
   - On failure: reverts status to `"uploaded"`
4. **Auto-Create POs & Vendors**: After extraction, `internalCreatePOsFromExtraction` runs server-side:
   - Iterates over extracted PO data (array for spreadsheets, wrapped array for single docs)
   - For each PO: creates vendor via `vendors.internalGetOrCreate` (case-insensitive dedup), creates PO if it doesn't exist, or matches to existing PO
   - Links document to the first created/matched PO, auto-advances PO status `draft` → `processing`
5. **Fallback Auto-Match**: If no `userId` is provided, falls back to `internalAutoMatch` (legacy match by PO number or tracking number)
6. **Review**: User can review extracted data in `document-details-drawer.tsx`, manually link/update PO. Multi-PO documents show an info banner with badge per PO.
7. **Manual Matching**: Manual match still available via `documents.matchToPO` mutation (advances PO status)
8. **Upload UX**: Files auto-upload immediately on selection (no queue step). Toast messages show creation/match counts.

## Document Statuses
- `uploaded` → initial state after file upload
- `processing` → OCR is running
- `extracted` → OCR complete, data extracted
- `matched` → document linked to a purchase order

## Extracted Data Structure (JSON)
```json
{
  "documentType": "invoice" | "bill_of_lading" | "packing_list" | "customs_declaration" | "shipping_manifest" | "freight_invoice" | "other",
  "trackingNumber": "string | null",
  "poNumber": "string | null",
  "vendorName": "string | null",
  "items": [{ "product": "string", "quantity": number }],
  "shippingDetails": "string | null",
  "orderDate": "YYYY-MM-DD | null",
  "deliveryDate": "YYYY-MM-DD | null",
  "totalAmount": "string | null",
  "deliveryFee": "number | null",
  "currency": "string | null",
  "notes": "string | null"
}
```

## Key Files
- `convex/ocr.ts` — `processDocument` action, `EXTRACTION_PROMPT`
- `convex/ocrResults.ts` — `create` mutation
- `convex/documents.ts` — CRUD, status management, matching, internal mutations
- `src/features/documents/components/upload-zone.tsx` — File upload UI
- `src/features/documents/components/camera-capture.tsx` — Camera capture UI
- `src/features/documents/components/ocr-review-dialog.tsx` — Review + auto-fill
- `src/features/documents/lib/auto-match.ts` — `findAutoMatch` with PO number & tracking number strategies

## Environment Variables
- `GEMINI_API_KEY` — Required Convex environment variable for Google Gemini AI
