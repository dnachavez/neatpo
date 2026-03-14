"use client";

import { Spinner } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProcessingItem {
  id: string;
  filename: string;
  progress: number;
  stage: string;
}

const processingItems: ProcessingItem[] = [
  {
    id: "1",
    filename: "customs_declaration_0315.pdf",
    progress: 75,
    stage: "Extracting data…",
  },
  {
    id: "2",
    filename: "shipping_manifest_q1.pdf",
    progress: 40,
    stage: "Running OCR…",
  },
  {
    id: "3",
    filename: "freight_invoice_march.pdf",
    progress: 10,
    stage: "Uploading…",
  },
];

export function ProcessingStatus() {
  return (
    <Card className="border-neutral-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-serif text-lg font-normal tracking-tight text-black">
          <Spinner size={16} className="animate-spin text-neutral-400" />
          Processing Queue
        </CardTitle>
      </CardHeader>
      <CardContent>
        {processingItems.length === 0 ? (
          <p className="py-4 text-center text-sm text-neutral-400">
            No documents currently processing
          </p>
        ) : (
          <div className="space-y-4">
            {processingItems.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-black">{item.filename}</span>
                  <span className="text-[11px] text-neutral-400">
                    {item.stage}
                  </span>
                </div>
                <Progress
                  value={item.progress}
                  className="h-1.5 bg-neutral-100 [&>div]:bg-black"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
