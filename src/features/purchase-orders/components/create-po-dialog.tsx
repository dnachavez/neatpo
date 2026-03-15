"use client";

import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Plus, CalendarBlank, TextT } from "@phosphor-icons/react";
import { toast } from "sonner";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

function formatDate(date: Date | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type FieldConfig = {
  _id: string;
  label: string;
  key: string;
  type:
    | "string"
    | "number"
    | "date"
    | "boolean"
    | "email"
    | "phone"
    | "url"
    | "textarea"
    | "currency"
    | "select"
    | "time"
    | "datetime";
  required: boolean;
  order: number;
  width: "full" | "half";
};

export function CreatePoDialog() {
  const [open, setOpen] = useState(false);

  const currentUser = useQuery(api.users.getByEmail, {
    email: "staff@neatpo.app",
  });
  const fieldConfigs = useQuery(
    api.fieldConfigs.list,
    currentUser?._id ? { userId: currentUser._id } : "skip",
  );
  const createPo = useMutation(api.purchaseOrders.create);

  const fields = useMemo(() => {
    return (fieldConfigs ?? []).sort((a, b) => a.order - b.order);
  }, [fieldConfigs]);

  // Group fields into rows based on width
  const rows = useMemo(() => {
    const result: FieldConfig[][] = [];
    let pendingHalf: FieldConfig | null = null;

    for (const field of fields) {
      if (field.width === "half") {
        if (pendingHalf) {
          result.push([pendingHalf, field]);
          pendingHalf = null;
        } else {
          pendingHalf = field;
        }
      } else {
        if (pendingHalf) {
          result.push([pendingHalf]);
          pendingHalf = null;
        }
        result.push([field]);
      }
    }
    if (pendingHalf) {
      result.push([pendingHalf]);
    }
    return result;
  }, [fields]);

  const form = useForm<Record<string, string | number | Date | undefined>>({
    defaultValues: {},
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = form;

  async function onSubmit(
    data: Record<string, string | number | Date | undefined>,
  ) {
    if (!currentUser?._id) {
      toast.error("Session not found. Please refresh and try again.");
      return;
    }

    // Validate required fields
    const missingRequired = fields.filter((f) => f.required && !data[f.key]);
    if (missingRequired.length > 0) {
      toast.error("Missing required fields", {
        description: missingRequired.map((f) => f.label).join(", "),
      });
      return;
    }

    // Extract PO number and supplier — these are special fields
    const poNumber = String(
      data["po_number"] ??
        data["poNumber"] ??
        `PO-${crypto.randomUUID().slice(0, 8)}`,
    );
    const supplier = String(
      data["supplier"] ?? data["supplier_name"] ?? "Unknown",
    );

    // Extract dates
    const now = new Date().getTime();
    let orderDate = now;
    let expectedDeliveryDate = now + 7 * 24 * 60 * 60 * 1000;

    for (const field of fields) {
      if (field.type === "date" && data[field.key]) {
        const dateVal = data[field.key];
        const timestamp =
          dateVal instanceof Date
            ? dateVal.getTime()
            : new Date(String(dateVal)).getTime();
        if (!Number.isNaN(timestamp)) {
          if (field.key.includes("order") || field.key.includes("created")) {
            orderDate = timestamp;
          }
          if (
            field.key.includes("delivery") ||
            field.key.includes("expected") ||
            field.key.includes("due")
          ) {
            expectedDeliveryDate = timestamp;
          }
        }
      }
    }

    // Extract delivery fee and currency
    let deliveryFee: number | undefined;
    let currency: string | undefined;
    let totalAmount: string | undefined;

    for (const field of fields) {
      const val = data[field.key];
      if (
        field.key.includes("delivery_fee") ||
        field.key.includes("deliveryFee") ||
        field.key.includes("shipping_fee")
      ) {
        deliveryFee =
          typeof val === "number" ? val : parseFloat(String(val ?? ""));
        if (Number.isNaN(deliveryFee)) deliveryFee = undefined;
      }
      if (field.key.includes("currency")) {
        currency = String(val ?? "");
      }
      if (field.key.includes("total") || field.key.includes("amount")) {
        totalAmount = String(val ?? "");
      }
    }

    // Build items from itemized fields or use a generic entry
    const items = [{ product: "See custom fields", quantity: 1 }];

    // Build custom fields object from all field values
    const customFields: Record<string, string> = {};
    for (const field of fields) {
      const val = data[field.key];
      if (val !== undefined && val !== "") {
        customFields[field.key] =
          val instanceof Date ? val.toISOString() : String(val);
      }
    }

    try {
      await createPo({
        poNumber,
        supplier,
        orderDate,
        expectedDeliveryDate,
        items,
        deliveryFee,
        totalAmount,
        currency,
        userId: currentUser._id,
        customFields:
          Object.keys(customFields).length > 0
            ? JSON.stringify(customFields)
            : undefined,
      });

      toast.success("Purchase order created", {
        description: `${poNumber} — ${supplier}`,
      });

      reset();
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error("Failed to create purchase order", {
        description: message.includes("already exists")
          ? message
          : "Please try again.",
      });
    }
  }

  const noFields = fields.length === 0;

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
            {noFields
              ? "Configure your form fields first, then come back to create a PO."
              : "Fill out the fields you defined to create a new purchase order."}
          </DialogDescription>
        </DialogHeader>

        {noFields ? (
          <div className="flex flex-col items-center rounded-lg border-2 border-dashed border-neutral-200 py-10">
            <TextT size={32} className="mb-2 text-neutral-200" />
            <p className="text-sm text-neutral-400">No fields configured yet</p>
            <p className="mt-1 text-center text-xs text-neutral-300">
              Go to <span className="font-medium text-black">Fields</span> to
              set up your purchase order form first.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {rows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className={cn("flex gap-4", row.length === 2 && "flex-row")}
              >
                {row.map((field) => (
                  <div
                    key={field._id}
                    className={cn(
                      "space-y-2",
                      row.length === 2 ? "flex-1" : "w-full",
                    )}
                  >
                    <Label className="text-sm font-medium">
                      {field.label}
                      {field.required && (
                        <span className="text-destructive ml-0.5">*</span>
                      )}
                    </Label>

                    {field.type === "date" ? (
                      <Controller
                        control={control}
                        name={field.key}
                        render={({ field: formField }) => {
                          const dateValue =
                            formField.value instanceof Date
                              ? formField.value
                              : undefined;
                          return (
                            <Popover>
                              <PopoverTrigger
                                render={
                                  <Button
                                    variant="outline"
                                    type="button"
                                    className={cn(
                                      "w-full justify-start border-neutral-200 text-left font-normal",
                                      !dateValue && "text-muted-foreground",
                                    )}
                                  />
                                }
                              >
                                <CalendarBlank
                                  size={16}
                                  className="mr-2 text-neutral-400"
                                />
                                {dateValue
                                  ? formatDate(dateValue)
                                  : "Pick a date"}
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={dateValue}
                                  onSelect={(date) => formField.onChange(date)}
                                />
                              </PopoverContent>
                            </Popover>
                          );
                        }}
                      />
                    ) : field.type === "number" ? (
                      <Input
                        type="number"
                        step="any"
                        placeholder="0"
                        className="border-neutral-200 bg-white"
                        {...register(field.key, { valueAsNumber: true })}
                      />
                    ) : field.type === "boolean" ? (
                      <Controller
                        control={control}
                        name={field.key}
                        render={({ field: formField }) => (
                          <div className="flex h-9 items-center">
                            <Switch
                              checked={!!formField.value}
                              onCheckedChange={formField.onChange}
                            />
                            <span className="ml-2 text-sm text-neutral-500">
                              {formField.value ? "Yes" : "No"}
                            </span>
                          </div>
                        )}
                      />
                    ) : field.type === "email" ? (
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        className="border-neutral-200 bg-white"
                        {...register(field.key)}
                      />
                    ) : field.type === "phone" ? (
                      <Input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        className="border-neutral-200 bg-white"
                        {...register(field.key)}
                      />
                    ) : field.type === "url" ? (
                      <Input
                        type="url"
                        placeholder="https://"
                        className="border-neutral-200 bg-white"
                        {...register(field.key)}
                      />
                    ) : field.type === "textarea" ? (
                      <textarea
                        placeholder={`Enter ${field.label.toLowerCase()}…`}
                        className="placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                        {...register(field.key)}
                      />
                    ) : field.type === "currency" ? (
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="border-neutral-200 bg-white"
                        {...register(field.key, { valueAsNumber: true })}
                      />
                    ) : field.type === "select" ? (
                      <Input
                        placeholder={`Enter ${field.label.toLowerCase()}…`}
                        className="border-neutral-200 bg-white"
                        {...register(field.key)}
                      />
                    ) : field.type === "time" ? (
                      <Input
                        type="time"
                        className="border-neutral-200 bg-white"
                        {...register(field.key)}
                      />
                    ) : field.type === "datetime" ? (
                      <Input
                        type="datetime-local"
                        className="border-neutral-200 bg-white"
                        {...register(field.key)}
                      />
                    ) : (
                      <Input
                        placeholder={`Enter ${field.label.toLowerCase()}…`}
                        className="border-neutral-200 bg-white"
                        {...register(field.key)}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}

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
        )}
      </DialogContent>
    </Dialog>
  );
}
