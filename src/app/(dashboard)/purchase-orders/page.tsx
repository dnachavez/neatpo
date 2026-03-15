"use client";

import {
  CreatePoDialog,
  PurchaseOrdersTable,
} from "@/features/purchase-orders";
import { Card, CardContent } from "@/components/ui/card";

export default function PurchaseOrdersPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl tracking-tight text-black">
            Purchase Orders
          </h1>
          <p className="text-sm text-neutral-400">
            Manage and track all purchase orders
          </p>
        </div>
        <CreatePoDialog />
      </div>

      <Card className="border-neutral-200 bg-white shadow-none">
        <CardContent className="pt-6">
          <PurchaseOrdersTable />
        </CardContent>
      </Card>
    </div>
  );
}
