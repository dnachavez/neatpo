"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PoSearchInput } from "./po-search-input";
import { PoListing } from "./po-listing";

export function PoSection() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Card className="border-neutral-200 bg-white shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
          Purchase Orders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PoSearchInput value={searchQuery} onChange={setSearchQuery} />
        <PoListing searchQuery={searchQuery} />
      </CardContent>
    </Card>
  );
}
