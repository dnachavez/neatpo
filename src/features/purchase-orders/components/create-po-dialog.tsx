"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash } from "@phosphor-icons/react";
import { createPoSchema, type CreatePoFormData } from "../types/po-schema";
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function CreatePoDialog() {
  const [open, setOpen] = useState(false);

  const form = useForm<CreatePoFormData>({
    resolver: zodResolver(createPoSchema),
    defaultValues: {
      poNumber: "",
      supplier: "",
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  function onSubmit(data: CreatePoFormData) {
    // TODO: Connect to Convex purchaseOrders.create mutation
    console.log("Create PO:", data);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button className="bg-black text-white hover:bg-neutral-800" />}
      >
        <Plus size={16} weight="bold" />
        Create PO
      </DialogTrigger>
      <DialogContent className="border-neutral-200 bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-normal tracking-tight">
            New Purchase Order
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-400">
            Create a structured record before attaching logistics documents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">PO Number</Label>
              <Input
                placeholder="PO-2026-006"
                className={cn(
                  "border-neutral-200 bg-white",
                  errors.poNumber && "border-destructive",
                )}
                {...register("poNumber")}
              />
              {errors.poNumber && (
                <p className="text-destructive text-xs">
                  {errors.poNumber.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Supplier</Label>
              <Input
                placeholder="Supplier name"
                className={cn(
                  "border-neutral-200 bg-white",
                  errors.supplier && "border-destructive",
                )}
                {...register("supplier")}
              />
              {errors.supplier && (
                <p className="text-destructive text-xs">
                  {errors.supplier.message}
                </p>
              )}
            </div>
          </div>

          <Separator className="bg-neutral-200" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Line Items</Label>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() =>
                  append({ description: "", quantity: 1, unitPrice: 0 })
                }
                className="text-neutral-500 hover:text-black"
              >
                <Plus size={14} /> Add item
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Description"
                    className="border-neutral-200 bg-white text-sm"
                    {...register(`items.${index}.description`)}
                  />
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    placeholder="Qty"
                    className="border-neutral-200 bg-white text-sm"
                    {...register(`items.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    className="border-neutral-200 bg-white text-sm"
                    {...register(`items.${index}.unitPrice`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => remove(index)}
                    className="hover:text-destructive mt-1 text-neutral-400"
                  >
                    <Trash size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-neutral-200"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white hover:bg-neutral-800"
            >
              {isSubmitting ? "Creating…" : "Create Purchase Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
