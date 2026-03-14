"use client";

import { useState } from "react";
import { LinkSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MatchDialog() {
  const [open, setOpen] = useState(false);
  const [poNumber, setPoNumber] = useState("");

  function handleMatch() {
    // TODO: Connect to Convex documents.matchToPO mutation
    console.log("Match document to PO:", poNumber);
    setPoNumber("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="border-neutral-200 text-neutral-500 hover:text-black"
          />
        }
      >
        <LinkSimple size={16} />
        Match to PO
      </DialogTrigger>
      <DialogContent className="border-neutral-200 bg-white sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-normal tracking-tight">
            Match Document to PO
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-400">
            Link this document to an existing purchase order for organized
            filing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">PO Number</Label>
            <Input
              placeholder="e.g. PO-2026-001"
              className="border-neutral-200 bg-white"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="border-neutral-200"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMatch}
              disabled={!poNumber.trim()}
              className="bg-black text-white hover:bg-neutral-800"
            >
              Match Document
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
