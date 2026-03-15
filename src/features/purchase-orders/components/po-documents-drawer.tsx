"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { format } from "date-fns";
import { FileMagnifyingGlass } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DocumentViewerDialog } from "@/features/documents";

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

interface PoDocumentsDrawerProps {
  purchaseOrderId: Id<"purchaseOrders">;
  poNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PoDocumentsDrawer({
  purchaseOrderId,
  poNumber,
  open,
  onOpenChange,
}: PoDocumentsDrawerProps) {
  const documents = useQuery(
    api.documents.listByPurchaseOrder,
    open ? { purchaseOrderId } : "skip",
  );

  const [viewerDoc, setViewerDoc] = useState<{
    storageId: string;
    filename: string;
    mimeType: string;
  } | null>(null);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="border-neutral-200 bg-white sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="font-serif text-lg font-normal tracking-tight">
              Documents for {poNumber}
            </SheetTitle>
            <SheetDescription className="text-sm text-neutral-400">
              All documents linked to this purchase order.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4">
            {documents === undefined ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="ml-auto h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : documents.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-400">
                No documents linked to this purchase order.
              </p>
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
                      Status
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
                      <TableCell className="max-w-[160px] truncate text-sm font-medium text-black">
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
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-neutral-500 hover:text-black"
                          onClick={() =>
                            setViewerDoc({
                              storageId: doc.fileStorageId,
                              filename: doc.filename,
                              mimeType: doc.mimeType,
                            })
                          }
                        >
                          <FileMagnifyingGlass size={14} />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {viewerDoc && (
        <DocumentViewerDialog
          storageId={viewerDoc.storageId}
          filename={viewerDoc.filename}
          mimeType={viewerDoc.mimeType}
          open={!!viewerDoc}
          onOpenChange={(isOpen) => {
            if (!isOpen) setViewerDoc(null);
          }}
        />
      )}
    </>
  );
}
