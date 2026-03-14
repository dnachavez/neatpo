"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { format } from "date-fns";
import { Eye } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OcrReviewDialog } from "./ocr-review-dialog";

type DocumentStatus = "uploaded" | "processing" | "extracted" | "matched";

const statusLabel: Record<DocumentStatus, string> = {
  uploaded: "Uploaded",
  processing: "Processing",
  extracted: "Extracted",
  matched: "Matched",
};

const statusVariant: Record<
  DocumentStatus,
  "default" | "secondary" | "outline"
> = {
  uploaded: "outline",
  processing: "secondary",
  extracted: "secondary",
  matched: "default",
};

export function DocumentHistoryTable() {
  const documents = useQuery(api.documents.list);
  const [reviewDocId, setReviewDocId] = useState<Id<"documents"> | null>(null);

  if (documents === undefined) {
    return (
      <Card className="border-neutral-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
            Document History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-neutral-400">Loading documents…</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-neutral-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
            Document History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-neutral-400">
                No documents uploaded yet
              </p>
            </div>
          ) : (
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
                  <TableHead className="text-xs font-medium text-neutral-400">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow
                    key={doc._id}
                    className="border-neutral-100 hover:bg-neutral-50"
                  >
                    <TableCell className="text-sm font-medium text-black">
                      {doc.filename}
                    </TableCell>
                    <TableCell className="text-sm text-neutral-400">
                      {format(new Date(doc.uploadedAt), "MMM d, yyyy")}
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
                      {doc.matchedPoNumber ?? (
                        <span className="text-neutral-300">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(doc.status === "extracted" ||
                        doc.status === "matched") && (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-neutral-500 hover:text-black"
                          onClick={() => setReviewDocId(doc._id)}
                        >
                          <Eye size={14} />
                          Review
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {reviewDocId && (
        <OcrReviewDialog
          documentId={reviewDocId}
          open={!!reviewDocId}
          onOpenChange={(open) => {
            if (!open) setReviewDocId(null);
          }}
        />
      )}
    </>
  );
}
