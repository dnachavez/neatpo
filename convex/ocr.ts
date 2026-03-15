"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

const EXTRACTION_PROMPT = `You are a logistics document analysis expert. Analyze the provided document image/PDF and extract structured data.

Return ONLY a valid JSON object with the following structure (use null for fields you cannot find):

{
  "documentType": "invoice" | "bill_of_lading" | "packing_list" | "customs_declaration" | "shipping_manifest" | "freight_invoice" | "other",
  "trackingNumber": "string or null",
  "poNumber": "string or null",
  "vendorName": "string or null",
  "items": [
    {
      "product": "string",
      "quantity": number
    }
  ],
  "shippingDetails": "string or null",
  "orderDate": "YYYY-MM-DD or null",
  "deliveryDate": "YYYY-MM-DD or null",
  "totalAmount": "string or null",
  "deliveryFee": number or null,
  "currency": "string or null",
  "notes": "string or null"
}

Be thorough and extract as much information as possible. For items, extract all line items you can find with their product names and quantities. If quantities are not clear, use 1 as default. For deliveryFee, extract any shipping, freight, or delivery charges as a numeric value. For currency, extract the currency code (e.g. "USD", "PHP", "EUR").`;

export const processDocument = action({
  args: {
    documentId: v.id("documents"),
    fileStorageId: v.string(),
    mimeType: v.string(),
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

      // Call Gemini API
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Build content parts based on MIME type
      const isSpreadsheet = SPREADSHEET_MIME_TYPES.includes(args.mimeType);
      let contentParts: Parameters<typeof model.generateContent>[0];

      if (isSpreadsheet) {
        // Convert spreadsheet to CSV text and send as text content
        const spreadsheetText = convertSpreadsheetToText(fileBuffer);
        contentParts = [
          EXTRACTION_PROMPT +
            "\n\nHere is the spreadsheet content:\n\n" +
            spreadsheetText,
        ];
      } else {
        // Send binary data (images, PDFs) as inline data
        const base64Data = Buffer.from(fileBuffer).toString("base64");
        contentParts = [
          EXTRACTION_PROMPT,
          {
            inlineData: {
              mimeType: args.mimeType,
              data: base64Data,
            },
          },
        ];
      }

      const result = await model.generateContent(contentParts);

      const responseText = result.response.text();

      // Parse the JSON from the response (strip markdown code fences if present)
      let extractedJson: string;
      try {
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonString = jsonMatch
          ? jsonMatch[1].trim()
          : responseText.trim();
        const parsed = JSON.parse(jsonString);
        extractedJson = JSON.stringify(parsed);
      } catch {
        // If parsing fails, store raw response as notes
        extractedJson = JSON.stringify({
          documentType: "other",
          trackingNumber: null,
          poNumber: null,
          vendorName: null,
          items: [],
          shippingDetails: null,
          orderDate: null,
          deliveryDate: null,
          totalAmount: null,
          deliveryFee: null,
          currency: null,
          notes: responseText,
        });
      }

      // Save OCR result
      await ctx.runMutation(internal.ocrResults.create, {
        documentId: args.documentId,
        extractedData: extractedJson,
        confidence: 0.85,
      });

      // Update document with extracted data
      const parsed = JSON.parse(extractedJson);
      await ctx.runMutation(internal.documents.internalUpdateExtractedData, {
        id: args.documentId,
        extractedData: extractedJson,
        documentType: parsed.documentType ?? "other",
      });

      return { success: true, extractedData: extractedJson };
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
