"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DocumentViewerDialogProps {
  storageId: string;
  filename: string;
  mimeType: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentViewerDialog({
  storageId,
  filename,
  mimeType,
  open,
  onOpenChange,
}: DocumentViewerDialogProps) {
  const fileUrl = useQuery(
    api.documents.getUrl,
    open ? { storageId } : "skip",
  );

  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-neutral-200 bg-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-normal tracking-tight">
            {filename}
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-400">
            Preview of uploaded document
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex items-center justify-center">
          {fileUrl === undefined ? (
            <Skeleton className="h-96 w-full rounded-md" />
          ) : fileUrl === null ? (
            <p className="py-12 text-sm text-neutral-400">
              File not available
            </p>
          ) : isImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Convex storage URL
            <img
              src={fileUrl}
              alt={filename}
              className="max-h-[70vh] w-auto rounded-md object-contain"
            />
          ) : isPdf ? (
            <iframe
              src={fileUrl}
              title={filename}
              className="h-[70vh] w-full rounded-md border border-neutral-200"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-12">
              <p className="text-sm text-neutral-400">
                Preview is not available for this file type.
              </p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-black underline underline-offset-4 hover:text-neutral-600"
              >
                Download file
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
