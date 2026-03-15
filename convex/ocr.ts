"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import * as XLSX from "xlsx";

const SPREADSHEET_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "text/csv", // .csv
];

/**
 * Convert an Excel/CSV file buffer to a CSV text representation
 * so Gemini can process it as text content.
 */
function convertSpreadsheetToText(buffer: ArrayBuffer): string {
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const sheets: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    sheets.push(`=== Sheet: ${sheetName} ===\n${csv}`);
  }

  return sheets.join("\n\n");
}

const EXTRACTION_PROMPT = `You are a logistics document data extraction expert. Your ONLY job is to extract structured data from the provided document and return it as a JSON object.

CRITICAL RULES:
1. Extract ONLY information that is explicitly present in the document.
2. Use null for any field where the information is NOT clearly found in the document.
3. Do NOT make up, guess, or hallucinate any data.
4. Do NOT put raw document content, JSON, or unprocessed data into any field — especially "notes".
5. The "notes" field is ONLY for brief, human-readable observations (e.g., "Document is partially illegible" or "Multiple currencies detected"). Leave it null if there's nothing noteworthy.

FIELD INSTRUCTIONS:
- "documentType": Classify as one of: "invoice", "bill_of_lading", "packing_list", "customs_declaration", "shipping_manifest", "freight_invoice", "other"
- "trackingNumber": Any shipment tracking or reference number (e.g., "1Z999AA10123456784")
- "poNumber": Purchase order number (e.g., "PO-2024-001")
- "vendorName": The supplier, vendor, or seller name
- "items": Array of line items with "product" (name/description) and "quantity" (integer, default 1 if unclear)
- "shippingDetails": Brief shipping info like carrier name, origin, destination
- "orderDate": Date in YYYY-MM-DD format (convert from any format)
- "deliveryDate": Expected delivery date in YYYY-MM-DD format
- "totalAmount": Total monetary amount as a string (e.g., "1,250.00")
- "deliveryFee": Shipping/freight/delivery fee as a number (e.g., 50.00), null if not found
- "currency": ISO currency code (e.g., "USD", "PHP", "EUR")
- "notes": ONLY brief human-readable observations, NOT raw data. Null if nothing noteworthy.`;

const SPREADSHEET_EXTRACTION_PROMPT = `You are a logistics document data extraction expert. Your ONLY job is to extract structured data from the provided spreadsheet and return it as a JSON array of purchase order objects.

CRITICAL RULES:
1. Extract ONLY information that is explicitly present in the spreadsheet.
2. Use null for any field where the information is NOT clearly found.
3. Do NOT make up, guess, or hallucinate any data.
4. Do NOT put raw spreadsheet content, JSON, or unprocessed data into any field — especially "notes".
5. The "notes" field is ONLY for brief, human-readable observations. Leave it null if there's nothing noteworthy.
6. If the spreadsheet contains MULTIPLE purchase orders (identified by different PO numbers, vendors, or clearly separated groups of items), return EACH as a separate object in the array.
7. If only one PO is found, still return it as a single-element array.

SPREADSHEET-SPECIFIC INSTRUCTIONS:
- Look for column headers to understand the structure.
- Row data under headers like "Item", "Product", "Description" → extract as items
- Row data under headers like "Qty", "Quantity", "Units" → extract as quantity for each item
- Look for cells labeled "PO", "Purchase Order", "PO Number", "PO#" → extract as poNumber
- Look for cells labeled "Vendor", "Supplier", "Sold By" → extract as vendorName
- Look for cells labeled "Date", "Order Date", "Invoice Date" → extract as orderDate
- Look for cells labeled "Total", "Grand Total", "Amount Due" → extract as totalAmount
- Group items by their PO number. If rows have different PO numbers, they belong to different purchase orders.
- If a PO number repeats across rows, all those rows belong to the same PO — aggregate their items.

FIELD INSTRUCTIONS (for each PO object in the array):
- "documentType": Classify as one of: "invoice", "bill_of_lading", "packing_list", "customs_declaration", "shipping_manifest", "freight_invoice", "other"
- "trackingNumber": Any shipment tracking or reference number
- "poNumber": Purchase order number (e.g., "PO-2024-001")
- "vendorName": The supplier, vendor, or seller name
- "items": Array of line items with "product" (name/description) and "quantity" (integer, default 1 if unclear)
- "shippingDetails": Brief shipping info like carrier name, origin, destination
- "orderDate": Date in YYYY-MM-DD format (convert from any format)
- "deliveryDate": Expected delivery date in YYYY-MM-DD format
- "totalAmount": Total monetary amount as a string (e.g., "1,250.00")
- "deliveryFee": Shipping/freight/delivery fee as a number (e.g., 50.00), null if not found
- "currency": ISO currency code (e.g., "USD", "PHP", "EUR")
- "notes": ONLY brief human-readable observations, NOT raw data. Null if nothing noteworthy.`;

/** Schema for a single PO extraction object */
const SINGLE_PO_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    documentType: {
      type: SchemaType.STRING,
      enum: ["invoice", "bill_of_lading", "packing_list", "customs_declaration", "shipping_manifest", "freight_invoice", "other"],
    },
    trackingNumber: { type: SchemaType.STRING, nullable: true },
    poNumber: { type: SchemaType.STRING, nullable: true },
    vendorName: { type: SchemaType.STRING, nullable: true },
    items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          product: { type: SchemaType.STRING },
          quantity: { type: SchemaType.NUMBER },
        },
        required: ["product", "quantity"],
      },
    },
    shippingDetails: { type: SchemaType.STRING, nullable: true },
    orderDate: { type: SchemaType.STRING, nullable: true },
    deliveryDate: { type: SchemaType.STRING, nullable: true },
    totalAmount: { type: SchemaType.STRING, nullable: true },
    deliveryFee: { type: SchemaType.NUMBER, nullable: true },
    currency: { type: SchemaType.STRING, nullable: true },
    notes: { type: SchemaType.STRING, nullable: true },
  },
  required: ["documentType", "items"],
};

/** Schema for single document extraction (non-spreadsheet) */
const GEMINI_RESPONSE_SCHEMA = SINGLE_PO_SCHEMA;

/** Schema for multi-PO spreadsheet extraction — returns an array of PO objects */
const GEMINI_MULTI_PO_RESPONSE_SCHEMA = {
  type: SchemaType.ARRAY,
  items: SINGLE_PO_SCHEMA,
};

/** Default fallback for a single PO that failed to parse */
const FALLBACK_PO = {
  documentType: "other" as const,
  trackingNumber: null,
  poNumber: null,
  vendorName: null,
  items: [] as { product: string; quantity: number }[],
  shippingDetails: null,
  orderDate: null,
  deliveryDate: null,
  totalAmount: null,
  deliveryFee: null,
  currency: null,
  notes: "OCR extraction could not parse the response. Please review manually.",
};

/**
 * Sanitize notes field — truncate if too long
 */
function sanitizeNotes(notes: string | null): string | null {
  if (notes && typeof notes === "string" && notes.length > 500) {
    return notes.substring(0, 200) + "… (truncated)";
  }
  return notes;
}

/**
 * Parse Gemini response text, handling JSON directly and markdown fences fallback.
 * Returns a raw parsed value (object or array).
 */
function parseGeminiResponse(responseText: string): unknown {
  try {
    return JSON.parse(responseText);
  } catch {
    // Fallback: try to extract JSON from markdown fences
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonString = jsonMatch
      ? jsonMatch[1].trim()
      : responseText.trim();
    return JSON.parse(jsonString);
  }
}

export const processDocument = action({
  args: {
    documentId: v.id("documents"),
    fileStorageId: v.string(),
    mimeType: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Update status to processing
    await ctx.runMutation(internal.documents.internalUpdateStatus, {
      id: args.documentId,
      status: "processing",
    });

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error(
          "GEMINI_API_KEY environment variable is not set. Add it to your Convex environment variables.",
        );
      }

      // Fetch file from Convex storage
      const fileUrl = await ctx.storage.getUrl(args.fileStorageId);
      if (!fileUrl) {
        throw new Error("File not found in storage");
      }

      const fileResponse = await fetch(fileUrl);
      const fileBuffer = await fileResponse.arrayBuffer();

      const genAI = new GoogleGenerativeAI(apiKey);
      const isSpreadsheet = SPREADSHEET_MIME_TYPES.includes(args.mimeType);

      if (isSpreadsheet) {
        // === MULTI-PO SPREADSHEET PATH ===
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            responseSchema: GEMINI_MULTI_PO_RESPONSE_SCHEMA as any,
            temperature: 0.1,
          },
        });

        const spreadsheetText = convertSpreadsheetToText(fileBuffer);
        const contentParts = [
          SPREADSHEET_EXTRACTION_PROMPT +
            "\n\nHere is the spreadsheet content:\n\n" +
            spreadsheetText,
        ];

        const result = await model.generateContent(contentParts);
        const responseText = result.response.text();

        // Parse as array of POs
        let poArray: Array<Record<string, unknown>>;
        try {
          const parsed = parseGeminiResponse(responseText);
          poArray = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          poArray = [FALLBACK_PO];
        }

        // Sanitize notes in each PO
        for (const po of poArray) {
          po.notes = sanitizeNotes(po.notes as string | null);
        }

        const extractedJson = JSON.stringify(poArray);

        // Save OCR result
        await ctx.runMutation(internal.ocrResults.create, {
          documentId: args.documentId,
          extractedData: extractedJson,
          confidence: 0.85,
        });

        // Update document with extracted data — use first PO's documentType
        const firstPo = poArray[0] || FALLBACK_PO;
        await ctx.runMutation(internal.documents.internalUpdateExtractedData, {
          id: args.documentId,
          extractedData: extractedJson,
          documentType: (firstPo.documentType as string) ?? "other",
        });

        // Auto-create POs and vendors from extracted data
        if (args.userId) {
          const creationResult: { created: number; matched: number; skipped: number } =
            await ctx.runMutation(
              internal.documents.internalCreatePOsFromExtraction,
              {
                documentId: args.documentId,
                userId: args.userId,
                extractedPOs: extractedJson,
              },
            );

          return {
            success: true,
            extractedData: extractedJson,
            multiPO: true,
            totalExtracted: poArray.length,
            ...creationResult,
          };
        }

        return {
          success: true,
          extractedData: extractedJson,
          multiPO: true,
          totalExtracted: poArray.length,
        };
      } else {
        // === SINGLE DOCUMENT PATH ===
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            responseSchema: GEMINI_RESPONSE_SCHEMA as any,
            temperature: 0.1,
          },
        });

        const base64Data = Buffer.from(fileBuffer).toString("base64");
        const contentParts = [
          EXTRACTION_PROMPT,
          {
            inlineData: {
              mimeType: args.mimeType,
              data: base64Data,
            },
          },
        ];

        const result = await model.generateContent(contentParts);
        const responseText = result.response.text();

        // Parse response as single PO
        let extractedJson: string;
        let parsed: Record<string, unknown>;
        try {
          parsed = parseGeminiResponse(responseText) as Record<string, unknown>;
          parsed.notes = sanitizeNotes(parsed.notes as string | null);
          extractedJson = JSON.stringify(parsed);
        } catch {
          parsed = { ...FALLBACK_PO };
          extractedJson = JSON.stringify(parsed);
        }

        // Save OCR result
        await ctx.runMutation(internal.ocrResults.create, {
          documentId: args.documentId,
          extractedData: extractedJson,
          confidence: 0.85,
        });

        // Update document with extracted data
        await ctx.runMutation(internal.documents.internalUpdateExtractedData, {
          id: args.documentId,
          extractedData: extractedJson,
          documentType: (parsed.documentType as string) ?? "other",
        });

        // Auto-create PO from extracted data if we have a userId
        if (args.userId) {
          // Wrap single PO in array for the shared creation mutation
          const creationResult: { created: number; matched: number; skipped: number } =
            await ctx.runMutation(
              internal.documents.internalCreatePOsFromExtraction,
              {
                documentId: args.documentId,
                userId: args.userId,
                extractedPOs: JSON.stringify([parsed]),
              },
            );

          return {
            success: true,
            extractedData: extractedJson,
            multiPO: false,
            ...creationResult,
          };
        }

        // Fallback: try legacy auto-match
        const matchResult: {
          matched: boolean;
          strategy: string | null;
          purchaseOrderId: string | null;
        } = await ctx.runMutation(internal.documents.internalAutoMatch, {
          documentId: args.documentId,
          poNumber: (parsed.poNumber as string) ?? undefined,
          trackingNumber: (parsed.trackingNumber as string) ?? undefined,
        });

        return {
          success: true,
          extractedData: extractedJson,
          multiPO: false,
          autoMatched: matchResult.matched,
          matchStrategy: matchResult.strategy,
        };
      }
    } catch (error) {
      // Revert status on failure
      await ctx.runMutation(internal.documents.internalUpdateStatus, {
        id: args.documentId,
        status: "uploaded",
      });

      const message =
        error instanceof Error ? error.message : "OCR processing failed";
      return { success: false, error: message };
    }
  },
});
