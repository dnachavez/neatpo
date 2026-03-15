"use client";

import { useState, useCallback, useRef } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { CloudArrowUp, Camera } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CameraCapture } from "./camera-capture";
import { DocumentDetailsDrawer } from "./document-details-drawer";
import type { Id } from "../../../../convex/_generated/dataModel";

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [reviewDocumentId, setReviewDocumentId] =
    useState<Id<"documents"> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = useQuery(api.users.getByEmail, {
    email: "staff@neatpo.app",
  });
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const createDocument = useMutation(api.documents.create);
  const processDocument = useAction(api.ocr.processDocument);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        handleFiles(files);
        e.target.value = "";
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser],
  );

  function handleFiles(files: File[]) {
    const validFiles = files.filter((file) => {
      const isValidSize = file.size <= 10 * 1024 * 1024;
      if (!isValidSize) {
        toast.error(`"${file.name}" is too large`, {
          description: "Maximum file size is 10MB.",
        });
      }
      return isValidSize;
    });

    for (const file of validFiles) {
      uploadAndProcess(file);
    }
  }

  function handleCameraCapture(file: File) {
    setCameraOpen(false);
    handleFiles([file]);
  }

  async function uploadAndProcess(file: File) {
    if (!currentUser?._id) {
      toast.error("Session not found", {
        description: "Please refresh and try again.",
      });
      return;
    }

    const uploadToastId = toast.loading(`Uploading "${file.name}"…`);

    try {
      const uploadUrl = await generateUploadUrl();
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResult.ok) {
        throw new Error("File upload failed");
      }

      const { storageId } = await uploadResult.json();

      const documentId = await createDocument({
        filename: file.name,
        fileStorageId: storageId,
        mimeType: file.type,
        userId: currentUser._id,
      });

      toast.loading(`Processing OCR for "${file.name}"…`, {
        id: uploadToastId,
      });

      const ocrResult = await processDocument({
        documentId,
        fileStorageId: storageId,
        mimeType: file.type,
        userId: currentUser._id,
      });

      if (ocrResult.success) {
        const messages: string[] = ["Extracted data saved."];

        if ("created" in ocrResult && typeof ocrResult.created === "number" && ocrResult.created > 0) {
          messages.push(`${ocrResult.created} PO(s) created.`);
        }
        if ("matched" in ocrResult && typeof ocrResult.matched === "number" && ocrResult.matched > 0) {
          messages.push(`${ocrResult.matched} PO(s) matched.`);
        }
        if ("autoMatched" in ocrResult && ocrResult.autoMatched) {
          messages.push("Auto-matched to an existing PO.");
        }

        toast.success(`"${file.name}" processed`, {
          id: uploadToastId,
          description: messages.join(" "),
          action: {
            label: "Review",
            onClick: () => setReviewDocumentId(documentId),
          },
        });
      } else {
        toast.error(`OCR failed for "${file.name}"`, {
          id: uploadToastId,
          description: ocrResult.error,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upload failed";
      toast.error(`Failed to process "${file.name}"`, {
        id: uploadToastId,
        description: message,
      });
    }
  }

  return (
    <>
      <Card className="border-neutral-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
            Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 p-12 transition-colors",
              isDragging && "border-black bg-neutral-50",
            )}
          >
            <CloudArrowUp
              size={40}
              weight="thin"
              className={cn(
                "mb-3 text-neutral-300",
                isDragging && "text-black",
              )}
            />
            <p className="text-sm text-neutral-500">
              Drag and drop your logistics documents here
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Any document up to 10MB each
            </p>
            <div className="mt-4 flex items-center gap-2">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                ref={fileInputRef}
              />
              <Button
                type="button"
                variant="outline"
                className="border-neutral-200 text-neutral-500 hover:text-black"
                onClick={() => fileInputRef.current?.click()}
              >
                <CloudArrowUp size={16} />
                Browse files
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-neutral-200 text-neutral-500 hover:text-black"
                onClick={() => setCameraOpen(true)}
              >
                <Camera size={16} />
                Camera
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <CameraCapture
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={handleCameraCapture}
      />

      {reviewDocumentId && (
        <DocumentDetailsDrawer
          documentId={reviewDocumentId}
          open={!!reviewDocumentId}
          onOpenChange={(open) => {
            if (!open) setReviewDocumentId(null);
          }}
        />
      )}
    </>
  );
}
