"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { CircleNotch, File, CheckCircle } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function ProcessingStatus() {
  const processingDocs = useQuery(api.documents.listProcessing);
  const isLoading = processingDocs === undefined;

  return (
    <Card className="border-neutral-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
          Processing Queue
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : processingDocs && processingDocs.length > 0 ? (
          <div className="space-y-2">
            {processingDocs.slice(0, 5).map((doc) => (
              <div
                key={doc._id}
                className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  {doc.status === "processing" ? (
                    <CircleNotch
                      size={14}
                      className="animate-spin text-blue-500"
                    />
                  ) : (
                    <File size={14} className="text-neutral-400" />
                  )}
                  <span className="text-sm text-black">{doc.filename}</span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    doc.status === "processing"
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-neutral-200 bg-neutral-50 text-neutral-600"
                  }`}
                >
                  {doc.status === "processing" ? "OCR Processing…" : "Queued"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle size={24} className="mb-2 text-emerald-500" />
            <p className="text-sm text-neutral-400">
              All documents processed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
