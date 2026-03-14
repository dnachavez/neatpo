import type { Metadata } from "next";
import { DocumentHistoryTable, MatchDialog } from "@/features/documents";

export const metadata: Metadata = {
  title: "Document History — NeatPO",
  description:
    "Track all uploaded logistics documents and their processing status.",
};

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl tracking-tight text-black">
            Document History
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Track all uploaded documents and their processing status
          </p>
        </div>
        <MatchDialog />
      </div>

      <DocumentHistoryTable />
    </div>
  );
}
