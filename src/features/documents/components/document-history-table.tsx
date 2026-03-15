"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DocStatus = "uploaded" | "processing" | "extracted" | "matched";

const statusConfig: Record<DocStatus, { label: string; className: string }> = {
  uploaded: {
    label: "Uploaded",
    className: "border-neutral-200 bg-neutral-50 text-neutral-600",
  },
  processing: {
    label: "Processing",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  extracted: {
    label: "Extracted",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  matched: {
    label: "Matched",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

export function DocumentHistoryTable() {
  const documents = useQuery(api.documents.list);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocStatus | "all">("all");

  const isLoading = documents === undefined;

  const filtered = documents?.filter((doc) => {
    const matchesSearch =
      !searchQuery ||
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.matchedPoNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Card className="border-neutral-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
          Document History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass
              size={14}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400"
            />
            <Input
              placeholder="Search documents…"
              className="border-neutral-200 bg-white pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as DocStatus | "all")}
          >
            <SelectTrigger className="h-9 w-36 border-neutral-200 bg-white text-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="uploaded">Uploaded</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="extracted">Extracted</SelectItem>
              <SelectItem value="matched">Matched</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="overflow-hidden rounded-md border border-neutral-200">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-200 bg-neutral-50/50">
                  <TableHead className="text-xs font-medium text-neutral-500">
                    Filename
                  </TableHead>
                  <TableHead className="text-xs font-medium text-neutral-500">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-medium text-neutral-500">
                    Linked PO
                  </TableHead>
                  <TableHead className="text-xs font-medium text-neutral-500">
                    Uploaded
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc) => {
                  const conf = statusConfig[doc.status];
                  return (
                    <TableRow key={doc._id} className="border-neutral-200">
                      <TableCell className="text-sm text-black">
                        {doc.filename}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${conf.className}`}
                        >
                          {conf.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-500">
                        {doc.matchedPoNumber ?? "—"}
                      </TableCell>
                      <TableCell className="text-[11px] text-neutral-400">
                        {formatDistanceToNow(new Date(doc.uploadedAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-neutral-400">
            {searchQuery || statusFilter !== "all"
              ? "No documents match your filters"
              : "No documents uploaded yet"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
