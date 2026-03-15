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

/**
 * Header detection patterns — used to auto-detect column roles from header text.
 * Each pattern is a list of substrings to match against (case-insensitive).
 */
const HEADER_PATTERNS: Record<string, string[]> = {
  poNumber: ["document number", "po number", "po#", "purchase order", "po ", "order number", "order no", "order #"],
  vendorName: ["vendor name", "supplier", "vendor", "sold by", "company name"],
  orderDate: ["date", "order date", "po date", "invoice date", "created"],
  quantity: ["quantity ordered", "qty ordered", "qty", "quantity", "units"],
  status: ["status"],
  product: ["product", "item", "description", "material", "goods"],
};

/**
 * Parse an XLSX/CSV file buffer directly into an array of PO objects.
 * Auto-detects columns from headers and groups rows by PO number.
 * This is instant and handles unlimited rows — no LLM needed.
 */
function parseSpreadsheetToPOs(buffer: ArrayBuffer): Array<Record<string, unknown>> {
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const allPOs = new Map<string, {
    poNumber: string;
    vendorName: string | null;
    orderDate: string | null;
    status: string | null;
    items: Array<{ product: string; quantity: number }>;
    totalQuantity: number;
  }>();

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows: Array<Record<string, string>> = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (rows.length === 0) continue;

    // Auto-detect columns from first row's keys
    const headers = Object.keys(rows[0]);
    const columnMap: Record<string, string | null> = {
      poNumber: null,
      vendorName: null,
      orderDate: null,
      quantity: null,
      status: null,
      product: null,
    };

    for (const header of headers) {
      const lowerHeader = header.toLowerCase().trim();
      for (const [role, patterns] of Object.entries(HEADER_PATTERNS)) {
        if (columnMap[role] === null && patterns.some((p) => lowerHeader.includes(p))) {
          columnMap[role] = header;
        }
      }
    }

    console.log(`[OCR] Sheet "${sheetName}" column mapping:`, JSON.stringify(columnMap));

    // Must have at least a PO number column to proceed
    if (!columnMap.poNumber) {
      console.log(`[OCR] Sheet "${sheetName}" skipped — no PO number column detected`);
      continue;
    }

    for (const row of rows) {
      const poNum = String(row[columnMap.poNumber!] ?? "").trim();
      if (!poNum) continue;

      const vendor = columnMap.vendorName ? String(row[columnMap.vendorName] ?? "").trim() || null : null;
      const dateRaw = columnMap.orderDate ? String(row[columnMap.orderDate] ?? "").trim() : null;
      const qtyRaw = columnMap.quantity ? row[columnMap.quantity] : null;
      const status = columnMap.status ? String(row[columnMap.status] ?? "").trim() || null : null;
      const product = columnMap.product ? String(row[columnMap.product] ?? "").trim() || "Assorted Product" : "Assorted Product";

      // Parse quantity
      let quantity = 1;
      if (qtyRaw !== null && qtyRaw !== "") {
        const parsed = Number(String(qtyRaw).replace(/,/g, ""));
        if (!isNaN(parsed) && parsed > 0) quantity = Math.round(parsed);
      }

      // Parse date to YYYY-MM-DD
      let orderDate: string | null = null;
      if (dateRaw) {
        // Try Excel serial number (e.g., 42643)
        const serialNum = Number(dateRaw);
        if (!isNaN(serialNum) && serialNum > 10000 && serialNum < 100000) {
          // Excel serial date → JS date
          const d = new Date((serialNum - 25569) * 86400 * 1000);
          orderDate = d.toISOString().split("T")[0];
        } else {
          // Try parsing as date string
          const d = new Date(dateRaw);
          if (!isNaN(d.getTime())) {
            orderDate = d.toISOString().split("T")[0];
          }
        }
      }

      // Group by PO number — aggregate items
      const existing = allPOs.get(poNum);
      if (existing) {
        existing.items.push({ product, quantity });
        existing.totalQuantity += quantity;
        // Update vendor/date if not set yet
        if (!existing.vendorName && vendor) existing.vendorName = vendor;
        if (!existing.orderDate && orderDate) existing.orderDate = orderDate;
        if (!existing.status && status) existing.status = status;
      } else {
        allPOs.set(poNum, {
          poNumber: poNum,
          vendorName: vendor,
          orderDate,
          status,
          items: [{ product, quantity }],
          totalQuantity: quantity,
        });
      }
    }
  }

  // Convert to the standard PO extraction format
  const result: Array<Record<string, unknown>> = [];
  for (const po of allPOs.values()) {
    result.push({
      documentType: "other",
      trackingNumber: null,
      poNumber: po.poNumber,
      vendorName: po.vendorName,
      items: po.items,
      shippingDetails: null,
      orderDate: po.orderDate,
      deliveryDate: null,
      totalAmount: null,
      deliveryFee: null,
      currency: null,
      notes: po.status ? `Status: ${po.status}` : null,
    });
  }

  return result;
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
        // Parse spreadsheet directly — no LLM needed for structured tabular data.
        // This is instant, reliable, and handles unlimited rows.
        const poArray = parseSpreadsheetToPOs(fileBuffer);
        console.log(`[OCR] Direct spreadsheet parse: ${poArray.length} POs extracted`);

        if (poArray.length === 0) {
          // Fallback to Gemini if direct parse found nothing
          // (e.g., unusual spreadsheet format without clear headers)
          console.log("[OCR] Direct parse found 0 POs, falling back to Gemini for this spreadsheet");
          const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
              responseMimeType: "application/json",
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              responseSchema: GEMINI_RESPONSE_SCHEMA as any,
              temperature: 0.1,
              maxOutputTokens: 8192,
            },
          });

          // Send first 30K chars of CSV to Gemini as a last resort
          const csvText = convertSpreadsheetToText(fileBuffer).substring(0, 30_000);
          const result = await model.generateContent([
            EXTRACTION_PROMPT + "\n\nHere is the spreadsheet content:\n\n" + csvText,
          ]);
          const responseText = result.response.text();
          console.log(`[OCR] Gemini fallback response (${responseText.length} chars):`, responseText.substring(0, 500));

          let parsed: Record<string, unknown>;
          try {
            parsed = parseGeminiResponse(responseText) as Record<string, unknown>;
          } catch (parseErr) {
            console.error("[OCR] Gemini fallback parse failed:", parseErr);
            parsed = { ...FALLBACK_PO };
          }

          const extractedJson = JSON.stringify([parsed]);
          await ctx.runMutation(internal.ocrResults.create, {
            documentId: args.documentId,
            extractedData: extractedJson,
            confidence: 0.5,
          });
          await ctx.runMutation(internal.documents.internalUpdateExtractedData, {
            id: args.documentId,
            extractedData: extractedJson,
            documentType: (parsed.documentType as string) ?? "other",
          });

          return { success: true, extractedData: extractedJson, multiPO: false, totalExtracted: 1 };
        }

        const extractedJson = JSON.stringify(poArray);

        // Save OCR result
        await ctx.runMutation(internal.ocrResults.create, {
          documentId: args.documentId,
          extractedData: extractedJson,
          confidence: 0.95, // Direct parse is high confidence
        });

        // Update document with extracted data
        const firstPo = poArray[0];
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
        console.log(`[OCR] Gemini single-doc response (${responseText.length} chars):`, responseText.substring(0, 500));

        // Parse response as single PO
        let extractedJson: string;
        let parsed: Record<string, unknown>;
        try {
          parsed = parseGeminiResponse(responseText) as Record<string, unknown>;
          parsed.notes = sanitizeNotes(parsed.notes as string | null);
          extractedJson = JSON.stringify(parsed);
        } catch (parseError) {
          console.error("[OCR] Failed to parse single-doc response:", parseError, "Raw:", responseText.substring(0, 500));
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
      console.error("[OCR] processDocument failed:", error instanceof Error ? error.message : error);
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
