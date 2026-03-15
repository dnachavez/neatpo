"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PoSearchInput } from "./po-search-input";
import { PoListing } from "./po-listing";

type PoStatus = "draft" | "processing" | "completed";
const ALL_STATUSES = "all" as const;

export function PoSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    PoStatus | typeof ALL_STATUSES
  >(ALL_STATUSES);

  return (
    <Card className="border-neutral-200 bg-white shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
          Purchase Orders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <PoSearchInput value={searchQuery} onChange={setSearchQuery} />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(val) =>
              setStatusFilter(val as PoStatus | typeof ALL_STATUSES)
            }
          >
            <SelectTrigger className="h-9 w-36 border-neutral-200 bg-white text-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <PoListing searchQuery={searchQuery} statusFilter={statusFilter} />
      </CardContent>
    </Card>
  );
}

