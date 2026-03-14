import type { Metadata } from "next";
import {
  PurchaseOrdersTable,
  CreatePoDialog,
} from "@/features/purchase-orders";

export const metadata: Metadata = {
  title: "Purchase Orders — NeatPO",
  description:
    "Create and manage purchase orders for your supply chain operations.",
};

export default function PurchaseOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl tracking-tight text-black">
            Purchase Orders
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Create structured records before attaching logistics documents
          </p>
        </div>
        <CreatePoDialog />
      </div>

      <PurchaseOrdersTable />
    </div>
  );
}
