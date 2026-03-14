"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  status: "draft" | "processing" | "completed";
  totalAmount: number;
  createdAt: string;
}

const sampleOrders: PurchaseOrder[] = [
  {
    id: "1",
    poNumber: "PO-2026-001",
    supplier: "Maersk Logistics",
    status: "completed",
    totalAmount: 24500.0,
    createdAt: "Mar 15, 2026",
  },
  {
    id: "2",
    poNumber: "PO-2026-002",
    supplier: "DHL Supply Chain",
    status: "processing",
    totalAmount: 18200.0,
    createdAt: "Mar 14, 2026",
  },
  {
    id: "3",
    poNumber: "PO-2026-003",
    supplier: "FedEx Freight",
    status: "draft",
    totalAmount: 9750.0,
    createdAt: "Mar 13, 2026",
  },
  {
    id: "4",
    poNumber: "PO-2026-004",
    supplier: "CMA CGM Group",
    status: "completed",
    totalAmount: 32100.0,
    createdAt: "Mar 12, 2026",
  },
  {
    id: "5",
    poNumber: "PO-2026-005",
    supplier: "Kuehne + Nagel",
    status: "processing",
    totalAmount: 14800.0,
    createdAt: "Mar 11, 2026",
  },
];

const statusVariant: Record<
  PurchaseOrder["status"],
  "default" | "secondary" | "outline"
> = {
  draft: "outline",
  processing: "secondary",
  completed: "default",
};

export function PurchaseOrdersTable() {
  return (
    <Card className="border-neutral-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
          All Purchase Orders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-200 hover:bg-transparent">
              <TableHead className="text-xs font-medium text-neutral-400">
                PO Number
              </TableHead>
              <TableHead className="text-xs font-medium text-neutral-400">
                Supplier
              </TableHead>
              <TableHead className="text-xs font-medium text-neutral-400">
                Status
              </TableHead>
              <TableHead className="text-right text-xs font-medium text-neutral-400">
                Amount
              </TableHead>
              <TableHead className="text-right text-xs font-medium text-neutral-400">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleOrders.map((order) => (
              <TableRow
                key={order.id}
                className="border-neutral-100 hover:bg-neutral-50"
              >
                <TableCell className="text-sm font-medium text-black">
                  {order.poNumber}
                </TableCell>
                <TableCell className="text-sm text-neutral-600">
                  {order.supplier}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={statusVariant[order.status]}
                    className="text-[11px] font-medium capitalize"
                  >
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-black">
                  ${order.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right text-sm text-neutral-400">
                  {order.createdAt}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
