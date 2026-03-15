"use client";

import { useState, useMemo } from "react";
import { usePaginatedQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { format } from "date-fns";
import {
  Eye,
  FileMagnifyingGlass,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OcrReviewDialog } from "./ocr-review-dialog";
import { DocumentViewerDialog } from "./document-viewer-dialog";

type DocumentStatus = "uploaded" | "processing" | "extracted" | "matched";

const ALL_STATUSES = "all" as const;

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

const PAGE_SIZE = 20;

export function DocumentHistoryTable() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.documents.listPaginated,
    {},
    { initialNumItems: PAGE_SIZE },
  );

  const [reviewDocId, setReviewDocId] = useState<Id<"documents"> | null>(null);
  const [viewerDoc, setViewerDoc] = useState<{
    storageId: string;
    filename: string;
    mimeType: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    DocumentStatus | typeof ALL_STATUSES
  >(ALL_STATUSES);

  const filteredDocuments = useMemo(() => {
    if (!results) return [];

    return results.filter((doc) => {
      // Status filter
      if (statusFilter !== ALL_STATUSES && doc.status !== statusFilter) {
        return false;
      }
      // Search filter (filename or matched PO number)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesFilename = doc.filename.toLowerCase().includes(q);
        const matchesPo = doc.matchedPoNumber
          ?.toLowerCase()
          .includes(q);
        if (!matchesFilename && !matchesPo) return false;
      }
      return true;
    });
  }, [results, searchQuery, statusFilter]);

  if (status === "LoadingFirstPage") {
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
              Document History
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <MagnifyingGlass
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <Input
                  placeholder="Search by filename or PO…"
                  className="h-8 w-56 border-neutral-200 bg-white pl-8 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(val) =>
                  setStatusFilter(
                    val as DocumentStatus | typeof ALL_STATUSES,
                  )
                }
              >
                <SelectTrigger className="h-8 w-36 border-neutral-200 bg-white text-sm">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="uploaded">Uploaded</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="extracted">Extracted</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-neutral-400">
                {results.length === 0
                  ? "No documents uploaded yet"
                  : "No documents match your filters"}
              </p>
            </div>
          ) : (
            <>
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
                  {filteredDocuments.map((doc) => (
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
                        <div className="flex items-center gap-1">
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {status === "CanLoadMore" && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-neutral-200 text-sm text-neutral-600"
                    onClick={() => loadMore(PAGE_SIZE)}
                  >
                    Load more
                  </Button>
                </div>
              )}
              {status === "LoadingMore" && (
                <div className="flex justify-center pt-4">
                  <p className="text-sm text-neutral-400">
                    Loading more documents…
                  </p>
                </div>
              )}
            </>
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

      {viewerDoc && (
        <DocumentViewerDialog
          storageId={viewerDoc.storageId}
          filename={viewerDoc.filename}
          mimeType={viewerDoc.mimeType}
          open={!!viewerDoc}
          onOpenChange={(open) => {
            if (!open) setViewerDoc(null);
          }}
        />
      )}
    </>
  );
}
