"use client";

import { useState, useCallback, useRef } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { CloudArrowUp, File, X, Camera, CircleNotch } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CameraCapture } from "./camera-capture";
import { OcrReviewDialog } from "./ocr-review-dialog";
import type { Id } from "../../../../convex/_generated/dataModel";

interface SelectedFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "uploaded" | "processing" | "extracted" | "error";
  documentId?: Id<"documents">;
  error?: string;
}

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [reviewDocumentId, setReviewDocumentId] = useState<Id<"documents"> | null>(null);
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
    addFiles(files);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        addFiles(files);
      }
    },
    [],
  );

  function addFiles(files: File[]) {
    const validFiles = files.filter((file) => {
      const isValidType = ["application/pdf", "image/jpeg", "image/png"].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      if (!isValidType) {
        toast.error(`"${file.name}" is not a supported format`, {
          description: "Please upload PDF, JPG, or PNG files.",
        });
      }
      if (!isValidSize) {
        toast.error(`"${file.name}" is too large`, {
          description: "Maximum file size is 10MB.",
        });
      }
      return isValidType && isValidSize;
    });

    const newFiles: SelectedFile[] = validFiles.map((file) => ({
      file,
      id: crypto.randomUUID(),
      status: "pending",
    }));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  }

  function removeFile(id: string) {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function handleCameraCapture(file: File) {
    addFiles([file]);
    setCameraOpen(false);
  }

  function updateFileStatus(
    id: string,
    update: Partial<SelectedFile>,
  ) {
    setSelectedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...update } : f)),
    );
  }

  async function handleUpload() {
    if (!currentUser?._id) {
      toast.error("Session not found", {
        description: "Please refresh and try again.",
      });
      return;
    }

    const pendingFiles = selectedFiles.filter((f) => f.status === "pending");

    for (const sf of pendingFiles) {
      try {
        // Step 1: Upload to Convex storage
        updateFileStatus(sf.id, { status: "uploading" });

        const uploadUrl = await generateUploadUrl();
        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": sf.file.type },
          body: sf.file,
        });

        if (!uploadResult.ok) {
          throw new Error("File upload failed");
        }

        const { storageId } = await uploadResult.json();

        // Step 2: Create document record
        const documentId = await createDocument({
          filename: sf.file.name,
          fileStorageId: storageId,
          mimeType: sf.file.type,
          userId: currentUser._id,
        });

        updateFileStatus(sf.id, {
          status: "uploaded",
          documentId,
        });

        toast.success(`"${sf.file.name}" uploaded successfully`, {
          description: "Starting OCR processing…",
        });

        // Step 3: Trigger OCR processing
        updateFileStatus(sf.id, { status: "processing" });

        const ocrResult = await processDocument({
          documentId,
          fileStorageId: storageId,
          mimeType: sf.file.type,
        });

        if (ocrResult.success) {
          updateFileStatus(sf.id, { status: "extracted" });
          toast.success(`OCR complete for "${sf.file.name}"`, {
            description: "Review extracted data to match with a purchase order.",
            action: {
              label: "Review",
              onClick: () => setReviewDocumentId(documentId),
            },
          });
        } else {
          updateFileStatus(sf.id, {
            status: "error",
            error: ocrResult.error,
          });
          toast.error(`OCR failed for "${sf.file.name}"`, {
            description: ocrResult.error,
          });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed";
        updateFileStatus(sf.id, { status: "error", error: message });
        toast.error(`Failed to process "${sf.file.name}"`, {
          description: message,
        });
      }
    }
  }

  const pendingCount = selectedFiles.filter(
    (f) => f.status === "pending",
  ).length;

  const statusBadge: Record<
    SelectedFile["status"],
    { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
  > = {
    pending: { label: "Ready", variant: "outline" },
    uploading: { label: "Uploading…", variant: "secondary" },
    uploaded: { label: "Uploaded", variant: "secondary" },
    processing: { label: "Processing OCR…", variant: "secondary" },
    extracted: { label: "Extracted", variant: "default" },
    error: { label: "Error", variant: "destructive" },
  };

  return (
    <>
      <Card className="border-neutral-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
            Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              className={cn("mb-3 text-neutral-300", isDragging && "text-black")}
            />
            <p className="text-sm text-neutral-500">
              Drag and drop your logistics documents here
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              PDF, PNG, JPG up to 10MB each
            </p>
            <div className="mt-4 flex items-center gap-2">
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
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

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              {selectedFiles.map((sf) => (
                <div
                  key={sf.id}
                  className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    {sf.status === "processing" || sf.status === "uploading" ? (
                      <CircleNotch size={16} className="animate-spin text-neutral-400" />
                    ) : (
                      <File size={16} className="text-neutral-400" />
                    )}
                    <span className="text-sm text-black">{sf.file.name}</span>
                    <span className="text-[11px] text-neutral-400">
                      {(sf.file.size / 1024).toFixed(1)} KB
                    </span>
                    <Badge
                      variant={statusBadge[sf.status].variant}
                      className="text-[10px]"
                    >
                      {statusBadge[sf.status].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {sf.status === "extracted" && sf.documentId && (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-xs text-neutral-500 hover:text-black"
                        onClick={() => setReviewDocumentId(sf.documentId!)}
                      >
                        Review
                      </Button>
                    )}
                    {(sf.status === "pending" || sf.status === "error") && (
                      <button
                        onClick={() => removeFile(sf.id)}
                        className="text-neutral-400 transition-colors hover:text-black"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {pendingCount > 0 && (
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleUpload}
                    className="bg-black text-white hover:bg-neutral-800"
                  >
                    <CloudArrowUp size={16} weight="bold" />
                    Upload & Process {pendingCount} file
                    {pendingCount > 1 ? "s" : ""}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CameraCapture
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={handleCameraCapture}
      />

      {reviewDocumentId && (
        <OcrReviewDialog
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
