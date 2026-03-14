"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DocumentRecord {
  id: string;
  filename: string;
  uploadedAt: string;
  status: "uploaded" | "processing" | "extracted" | "matched";
  matchedPO: string | null;
}

const sampleDocuments: DocumentRecord[] = [
  {
    id: "1",
    filename: "invoice_march_2026.pdf",
    uploadedAt: "Mar 15, 2026",
    status: "matched",
    matchedPO: "PO-2026-001",
  },
  {
    id: "2",
    filename: "bill_of_lading_0312.pdf",
    uploadedAt: "Mar 14, 2026",
    status: "extracted",
    matchedPO: null,
  },
  {
    id: "3",
    filename: "customs_declaration_0315.pdf",
    uploadedAt: "Mar 14, 2026",
    status: "processing",
    matchedPO: null,
  },
  {
    id: "4",
    filename: "packing_list_feb.pdf",
    uploadedAt: "Mar 13, 2026",
    status: "matched",
    matchedPO: "PO-2026-002",
  },
  {
    id: "5",
    filename: "shipping_manifest_q1.pdf",
    uploadedAt: "Mar 12, 2026",
    status: "processing",
    matchedPO: null,
  },
  {
    id: "6",
    filename: "freight_invoice_jan.pdf",
    uploadedAt: "Mar 11, 2026",
    status: "uploaded",
    matchedPO: null,
  },
];

const statusLabel: Record<DocumentRecord["status"], string> = {
  uploaded: "Uploaded",
  processing: "Processing",
  extracted: "Extracted",
  matched: "Matched",
};

const statusVariant: Record<
  DocumentRecord["status"],
  "default" | "secondary" | "outline"
> = {
  uploaded: "outline",
  processing: "secondary",
  extracted: "secondary",
  matched: "default",
};

export function DocumentHistoryTable() {
  return (
    <Card className="border-neutral-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
          Document History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-200 hover:bg-transparent">
              <TableHead className="text-xs font-medium text-neutral-400">
                Filename
              </TableHead>
              <TableHead className="text-xs font-medium text-neutral-400">
                Uploaded
              </TableHead>
              <TableHead className="text-xs font-medium text-neutral-400">
                OCR Status
              </TableHead>
              <TableHead className="text-xs font-medium text-neutral-400">
                Matched PO
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleDocuments.map((doc) => (
              <TableRow
                key={doc.id}
                className="border-neutral-100 hover:bg-neutral-50"
              >
                <TableCell className="text-sm font-medium text-black">
                  {doc.filename}
                </TableCell>
                <TableCell className="text-sm text-neutral-400">
                  {doc.uploadedAt}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={statusVariant[doc.status]}
                    className="text-[11px] font-medium"
                  >
                    {statusLabel[doc.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-neutral-500">
                  {doc.matchedPO ?? (
                    <span className="text-neutral-300">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
