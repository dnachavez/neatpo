import type { Metadata } from "next";
import { UploadZone } from "@/features/documents";

export const metadata: Metadata = {
  title: "Scan & Upload — NeatPO",
  description:
    "Upload and scan logistics documents for automated data extraction via OCR.",
};

export default function ScanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl tracking-tight text-black">
          Scan & Upload
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Upload logistics documents for automated OCR data extraction
        </p>
      </div>

      <UploadZone />
    </div>
  );
}
