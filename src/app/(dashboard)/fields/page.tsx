"use client";

import { FieldConfigManager } from "@/features/fields";

export default function FieldsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-serif text-2xl tracking-tight text-black">
          Field Configuration
        </h1>
        <p className="text-sm text-neutral-400">
          Define the default fields for your purchase orders and document
          extraction
        </p>
      </div>

      <FieldConfigManager />
    </div>
  );
}
