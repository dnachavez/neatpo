"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction, useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import {
  DotsThree,
  Eye,
  DownloadSimple,
  ArrowClockwise,
  Plus,
  Trash,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DocumentDetailsDrawer } from "./document-details-drawer";

type DocStatus = "uploaded" | "processing" | "extracted" | "matched";

const statusConfig: Record<DocStatus, { label: string; className: string }> = {
  uploaded: {
    label: "Uploaded",
    className: "border-neutral-200 bg-neutral-50 text-neutral-600",
  },
  processing: {
    label: "Processing",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  extracted: {
    label: "Extracted",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  matched: {
    label: "Matched",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

export function DocumentHistoryTable() {
  const documents = useQuery(api.documents.list);
  const removeDocument = useMutation(api.documents.remove);
  const processDocument = useAction(api.ocr.processDocument);
  const convex = useConvex();
  const currentUser = useQuery(api.users.getByEmail, {
    email: "staff@neatpo.app",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocStatus | "all">("all");
  const [reviewDocumentId, setReviewDocumentId] =
    useState<Id<"documents"> | null>(null);
  const [deleteDocumentId, setDeleteDocumentId] =
    useState<Id<"documents"> | null>(null);

  const isLoading = documents === undefined;

  const filtered = documents?.filter((doc) => {
    const matchesSearch =
      !searchQuery ||
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.matchedPoNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleDownload(fileStorageId: string) {
    try {
      const url = await convex.query(api.documents.getUrl, {
        storageId: fileStorageId,
      });
      if (url) {
        window.open(url, "_blank");
      } else {
        toast.error("File not found");
      }
    } catch {
      toast.error("Failed to get download URL");
    }
  }

  async function handleReprocess(
    documentId: Id<"documents">,
    fileStorageId: string,
    mimeType: string,
  ) {
    try {
      toast.info("Re-processing document…");
      await processDocument({
        documentId,
        fileStorageId,
        mimeType,
        userId: currentUser?._id,
      });
      toast.success("Document re-processed");
    } catch {
      toast.error("Failed to re-process document");
    }
  }

  async function handleDelete() {
    if (!deleteDocumentId) return;
    try {
      await removeDocument({ id: deleteDocumentId });
      toast.success("Document deleted");
      setDeleteDocumentId(null);
    } catch {
      toast.error("Failed to delete document");
    }
  }

  return (
    <>
      <Card className="border-neutral-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
            Document History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass
                size={14}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400"
              />
              <Input
                placeholder="Search documents…"
                className="border-neutral-200 bg-white pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(val) =>
                setStatusFilter(val as DocStatus | "all")
              }
            >
              <SelectTrigger className="h-9 w-36 border-neutral-200 bg-white text-sm">
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

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered && filtered.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-neutral-200">
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-200 bg-neutral-50/50">
                    <TableHead className="text-xs font-medium text-neutral-500">
                      Filename
                    </TableHead>
                    <TableHead className="text-xs font-medium text-neutral-500">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-medium text-neutral-500">
                      Linked PO
                    </TableHead>
                    <TableHead className="text-xs font-medium text-neutral-500">
                      Uploaded
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((doc) => {
                    const conf = statusConfig[doc.status];
                    const canReprocess =
                      doc.status === "uploaded" || doc.status === "extracted";
                    const canCreatePO =
                      doc.status === "extracted" && !doc.purchaseOrderId;

                    return (
                      <TableRow key={doc._id} className="border-neutral-200">
                        <TableCell>
                          <button
                            className="text-left text-sm font-medium text-black underline-offset-2 hover:underline"
                            onClick={() => setReviewDocumentId(doc._id)}
                          >
                            {doc.filename}
                          </button>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${conf.className}`}
                          >
                            {conf.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-neutral-500">
                          {doc.matchedPoNumber ?? "—"}
                        </TableCell>
                        <TableCell className="text-[11px] text-neutral-400">
                          {formatDistanceToNow(new Date(doc.uploadedAt), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="text-neutral-400 hover:text-black"
                                />
                              }
                            >
                              <DotsThree size={16} weight="bold" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48"
                            >
                              <DropdownMenuItem
                                onClick={() => setReviewDocumentId(doc._id)}
                              >
                                <Eye size={14} className="mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDownload(doc.fileStorageId)
                                }
                              >
                                <DownloadSimple size={14} className="mr-2" />
                                Download
                              </DropdownMenuItem>
                              {canReprocess && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleReprocess(
                                      doc._id,
                                      doc.fileStorageId,
                                      doc.mimeType,
                                    )
                                  }
                                >
                                  <ArrowClockwise size={14} className="mr-2" />
                                  Re-process OCR
                                </DropdownMenuItem>
                              )}
                              {canCreatePO && (
                                <DropdownMenuItem
                                  onClick={() => setReviewDocumentId(doc._id)}
                                >
                                  <Plus size={14} className="mr-2" />
                                  Link to PO
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => setDeleteDocumentId(doc._id)}
                              >
                                <Trash size={14} className="mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-neutral-400">
              {searchQuery || statusFilter !== "all"
                ? "No documents match your filters"
                : "No documents uploaded yet"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Document Details Drawer */}
      {reviewDocumentId && (
        <DocumentDetailsDrawer
          documentId={reviewDocumentId}
          open={!!reviewDocumentId}
          onOpenChange={(open) => {
            if (!open) setReviewDocumentId(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteDocumentId}
        onOpenChange={(open) => {
          if (!open) setDeleteDocumentId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document and its extracted data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
