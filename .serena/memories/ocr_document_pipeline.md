# OCR & Document Processing Pipeline

## Flow
1. **Upload**: User uploads a document via `upload-zone.tsx` or captures via `camera-capture.tsx`
2. **Storage**: File is stored in Convex file storage via `documents.generateUploadUrl` + `documents.create`
3. **Processing**: `ocr.processDocument` action is triggered
   - Sets document status to `"processing"`
   - Fetches file from Convex storage
   - Converts to base64 and sends to Gemini 2.0 Flash model with `EXTRACTION_PROMPT`
   - Parses the structured JSON response
   - Saves OCR result via `ocrResults.create`
   - Updates document with extracted data via `documents.internalUpdateExtractedData`
   - On failure: reverts status to `"uploaded"`
4. **Review**: User reviews extracted data in `ocr-review-dialog.tsx`, can auto-fill linked PO
5. **Matching**: Manual or auto-match via `documents.matchToPO` mutation (advances PO status)

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
