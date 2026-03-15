"use client";

import { UploadZone, DocumentHistoryTable } from "@/features/documents";

export default function ScanPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-serif text-2xl tracking-tight text-black">
          Scan &amp; Upload
        </h1>
        <p className="text-sm text-neutral-400">
          Upload logistics documents to auto-fill purchase order fields
        </p>
      </div>

      <UploadZone />
      <DocumentHistoryTable />
    </div>
  );
}
