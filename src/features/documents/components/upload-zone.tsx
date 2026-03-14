"use client";

import { useState, useCallback } from "react";
import { CloudArrowUp, File, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SelectedFile {
  file: File;
  id: string;
}

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
    },
    []
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      addFiles(files);
    },
    []
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        addFiles(files);
      }
    },
    []
  );

  function addFiles(files: File[]) {
    const newFiles = files.map((file) => ({
      file,
      id: crypto.randomUUID(),
    }));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  }

  function removeFile(id: string) {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function handleUpload() {
    // TODO: Connect to Convex documents.create mutation + file storage
    console.log(
      "Upload files:",
      selectedFiles.map((f) => f.file.name)
    );
    setSelectedFiles([]);
  }

  return (
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
            isDragging && "border-black bg-neutral-50"
          )}
        >
          <CloudArrowUp
            size={40}
            weight="thin"
            className={cn(
              "mb-3 text-neutral-300",
              isDragging && "text-black"
            )}
          />
          <p className="text-sm text-neutral-500">
            Drag and drop your logistics documents here
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            PDF, PNG, JPG up to 10MB each
          </p>
          <label className="mt-4">
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
              className="hidden"
            />
            <span className="cursor-pointer rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-100">
              Browse files
            </span>
          </label>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            {selectedFiles.map((sf) => (
              <div
                key={sf.id}
                className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <File size={16} className="text-neutral-400" />
                  <span className="text-sm text-black">{sf.file.name}</span>
                  <span className="text-[11px] text-neutral-400">
                    {(sf.file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  onClick={() => removeFile(sf.id)}
                  className="text-neutral-400 transition-colors hover:text-black"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleUpload}
                className="bg-black text-white hover:bg-neutral-800"
              >
                <CloudArrowUp size={16} weight="bold" />
                Upload {selectedFiles.length} file
                {selectedFiles.length > 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
