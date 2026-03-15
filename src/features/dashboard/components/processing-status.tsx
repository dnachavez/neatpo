"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Spinner } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const stageLabel: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  uploaded: { label: "Queued", variant: "outline" },
  processing: { label: "Running OCR…", variant: "secondary" },
};

export function ProcessingStatus() {
  const processingDocs = useQuery(api.documents.listProcessing);

  const hasItems = processingDocs && processingDocs.length > 0;

  return (
    <Card className="border-neutral-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-serif text-lg font-normal tracking-tight text-black">
          {hasItems && (
            <Spinner size={16} className="animate-spin text-neutral-400" />
          )}
          Processing Queue
          {hasItems && (
            <Badge variant="secondary" className="text-[10px] font-normal">
              {processingDocs.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {processingDocs === undefined ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border border-neutral-100 px-3 py-2"
              >
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : processingDocs.length === 0 ? (
          <p className="py-4 text-center text-sm text-neutral-400">
            No documents currently processing
          </p>
        ) : (
          <div className="space-y-3">
            {processingDocs.map((doc) => (
              <div
                key={doc._id}
                className="flex items-center justify-between rounded-md border border-neutral-100 px-3 py-2"
              >
                <span className="truncate pr-3 text-sm text-black">
                  {doc.filename}
                </span>
                <Badge
                  variant={stageLabel[doc.status]?.variant ?? "outline"}
                  className="shrink-0 text-[10px]"
                >
                  {stageLabel[doc.status]?.label ?? doc.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
