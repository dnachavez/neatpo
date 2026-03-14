"use client";

import { useState } from "react";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Plus, Trash, CalendarBlank } from "@phosphor-icons/react";
import { toast } from "sonner";
import { createPoBaseSchema, type CreatePoFormData } from "../types/po-schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

function formatDate(date: Date | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CreatePoDialog() {
  const [open, setOpen] = useState(false);
  const [orderDateOpen, setOrderDateOpen] = useState(false);
  const [deliveryDateOpen, setDeliveryDateOpen] = useState(false);

  const suppliers = useQuery(api.suppliers.list);
  const currentUser = useQuery(api.users.getByEmail, {
    email: "staff@neatpo.app",
  });
  const createPo = useMutation(api.purchaseOrders.create);

  const form = useForm<CreatePoFormData>({
    resolver: zodResolver(createPoBaseSchema),
    defaultValues: {
      poNumber: "",
      supplier: "",
      orderDate: new Date(),
      expectedDeliveryDate: undefined,
      items: [{ product: "", quantity: 1 }],
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

  const orderDate = useWatch({ control, name: "orderDate" });

  async function onSubmit(data: CreatePoFormData) {
    if (data.expectedDeliveryDate < data.orderDate) {
      form.setError("expectedDeliveryDate", {
        message: "Expected delivery date must be on or after the order date",
      });
      return;
    }

    if (!currentUser?._id) {
      toast.error("Unable to create purchase order", {
        description: "User session not found. Please refresh and try again.",
      });
      return;
    }

    try {
      await createPo({
        poNumber: data.poNumber,
        supplier: data.supplier,
        orderDate: data.orderDate.getTime(),
        expectedDeliveryDate: data.expectedDeliveryDate.getTime(),
        items: data.items,
        userId: currentUser._id,
      });

      toast.success("Purchase order created successfully", {
        description: `PO ${data.poNumber} has been saved.`,
      });

      reset();
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error("Failed to create purchase order", {
        description: message.includes("already exists")
          ? message
          : "Please try again or contact support.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button className="bg-black text-white hover:bg-neutral-800" />}
      >
        <Plus size={16} weight="bold" />
        Create PO
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-neutral-200 bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-normal tracking-tight">
            New Purchase Order
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-400">
            Create a structured record before attaching logistics documents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* PO Number */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              PO Number <span className="text-destructive">*</span>
            </Label>
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

          {/* Supplier */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Supplier Name <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="supplier"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    className={cn(
                      "w-full border-neutral-200 bg-white",
                      errors.supplier && "border-destructive",
                    )}
                  >
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers === undefined ? (
                      <SelectItem value="__loading" disabled>
                        Loading suppliers…
                      </SelectItem>
                    ) : suppliers.length === 0 ? (
                      <SelectItem value="__empty" disabled>
                        No suppliers found
                      </SelectItem>
                    ) : (
                      suppliers.map((s) => (
                        <SelectItem key={s._id} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.supplier && (
              <p className="text-destructive text-xs">
                {errors.supplier.message}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            {/* Order Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Order Date <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="orderDate"
                render={({ field }) => (
                  <Popover open={orderDateOpen} onOpenChange={setOrderDateOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          variant="outline"
                          type="button"
                          className={cn(
                            "w-full justify-start border-neutral-200 text-left font-normal",
                            !field.value && "text-muted-foreground",
                            errors.orderDate && "border-destructive",
                          )}
                        />
                      }
                    >
                      <CalendarBlank
                        size={16}
                        className="mr-2 text-neutral-400"
                      />
                      {field.value ? formatDate(field.value) : "Pick a date"}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setOrderDateOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.orderDate && (
                <p className="text-destructive text-xs">
                  {errors.orderDate.message}
                </p>
              )}
            </div>

            {/* Expected Delivery Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Expected Delivery <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="expectedDeliveryDate"
                render={({ field }) => (
                  <Popover
                    open={deliveryDateOpen}
                    onOpenChange={setDeliveryDateOpen}
                  >
                    <PopoverTrigger
                      render={
                        <Button
                          variant="outline"
                          type="button"
                          className={cn(
                            "w-full justify-start border-neutral-200 text-left font-normal",
                            !field.value && "text-muted-foreground",
                            errors.expectedDeliveryDate && "border-destructive",
                          )}
                        />
                      }
                    >
                      <CalendarBlank
                        size={16}
                        className="mr-2 text-neutral-400"
                      />
                      {field.value ? formatDate(field.value) : "Pick a date"}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setDeliveryDateOpen(false);
                        }}
                        disabled={(date) =>
                          orderDate ? date < orderDate : false
                        }
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.expectedDeliveryDate && (
                <p className="text-destructive text-xs">
                  {errors.expectedDeliveryDate.message}
                </p>
              )}
            </div>
          </div>

          <Separator className="bg-neutral-200" />

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Line Items <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => append({ product: "", quantity: 1 })}
                className="text-neutral-500 hover:text-black"
              >
                <Plus size={14} /> Add item
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="space-y-1">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Product / item name"
                      className={cn(
                        "border-neutral-200 bg-white text-sm",
                        errors.items?.[index]?.product && "border-destructive",
                      )}
                      {...register(`items.${index}.product`)}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="Qty"
                      min={1}
                      step={1}
                      className={cn(
                        "border-neutral-200 bg-white text-sm",
                        errors.items?.[index]?.quantity && "border-destructive",
                      )}
                      {...register(`items.${index}.quantity`, {
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
                {(errors.items?.[index]?.product ||
                  errors.items?.[index]?.quantity) && (
                  <p className="text-destructive text-xs">
                    {errors.items?.[index]?.product?.message ||
                      errors.items?.[index]?.quantity?.message}
                  </p>
                )}
              </div>
            ))}
            {errors.items?.root && (
              <p className="text-destructive text-xs">
                {errors.items.root.message}
              </p>
            )}
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
