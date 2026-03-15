"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowsOutLineHorizontal,
  ArrowsInLineHorizontal,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const fieldSchema = z.object({
  label: z.string().min(1, "Label is required"),
  key: z.string().min(1, "Field key is required"),
  type: z.enum([
    "string",
    "number",
    "date",
    "boolean",
    "email",
    "phone",
    "url",
    "textarea",
    "currency",
    "select",
    "time",
    "datetime",
  ]),
  required: z.boolean(),
  width: z.enum(["full", "half"]),
});

type FieldFormData = z.infer<typeof fieldSchema>;

interface AddFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editField?: {
    _id: Id<"fieldConfigs">;
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
    width: "full" | "half";
  } | null;
  fieldCount: number;
}

export function AddFieldDialog({
  open,
  onOpenChange,
  editField,
  fieldCount,
}: AddFieldDialogProps) {
  const currentUser = useQuery(api.users.getByEmail, {
    email: "staff@neatpo.app",
  });
  const createField = useMutation(api.fieldConfigs.create);
  const updateField = useMutation(api.fieldConfigs.update);

  const isEditing = !!editField;

  const form = useForm<FieldFormData>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      label: "",
      key: "",
      type: "string",
      required: false,
      width: "full",
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const currentWidth = watch("width");

  // Auto-generate key from label
  const label = watch("label");
  useEffect(() => {
    if (!isEditing && label) {
      const key = label
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "_");
      setValue("key", key);
    }
  }, [label, isEditing, setValue]);

  // Populate form when editing
  useEffect(() => {
    if (editField) {
      reset({
        label: editField.label,
        key: editField.key,
        type: editField.type,
        required: editField.required,
        width: editField.width,
      });
    } else {
      reset({
        label: "",
        key: "",
        type: "string",
        required: false,
        width: "full",
      });
    }
  }, [editField, reset]);

  async function onSubmit(data: FieldFormData) {
    if (!currentUser?._id) {
      toast.error("Session not found");
      return;
    }

    try {
      if (isEditing && editField) {
        await updateField({
          id: editField._id,
          label: data.label,
          type: data.type,
          required: data.required,
          width: data.width,
        });
        toast.success(`Field "${data.label}" updated`);
      } else {
        await createField({
          userId: currentUser._id,
          label: data.label,
          key: data.key,
          type: data.type,
          required: data.required,
          order: fieldCount,
          width: data.width,
        });
        toast.success(`Field "${data.label}" created`);
      }
      reset();
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      toast.error(
        isEditing ? "Failed to update field" : "Failed to create field",
        {
          description: message,
        },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-neutral-200 bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-normal tracking-tight">
            {isEditing ? "Edit Field" : "Add Field"}
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-400">
            {isEditing
              ? "Update the field configuration."
              : "Add a new field to your purchase order form."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Label <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g. Supplier Name"
              className={cn(
                "border-neutral-200 bg-white",
                errors.label && "border-destructive",
              )}
              {...register("label")}
            />
            {errors.label && (
              <p className="text-destructive text-xs">{errors.label.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Key <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="supplier_name"
              className={cn(
                "border-neutral-200 bg-white font-mono text-sm",
                errors.key && "border-destructive",
              )}
              disabled={isEditing}
              {...register("key")}
            />
            {errors.key && (
              <p className="text-destructive text-xs">{errors.key.message}</p>
            )}
            <p className="text-[10px] text-neutral-400">
              {isEditing
                ? "Key cannot be changed after creation."
                : "Auto-generated from label. Used for data mapping."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="border-neutral-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="boolean">Yes / No</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="textarea">Long Text</SelectItem>
                      <SelectItem value="currency">Currency</SelectItem>
                      <SelectItem value="select">Dropdown</SelectItem>
                      <SelectItem value="time">Time</SelectItem>
                      <SelectItem value="datetime">Date & Time</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Width</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue("width", "full")}
                  className={cn(
                    "flex-1 border-neutral-200",
                    currentWidth === "full" && "border-black bg-neutral-50",
                  )}
                >
                  <ArrowsOutLineHorizontal size={14} />
                  Full
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue("width", "half")}
                  className={cn(
                    "flex-1 border-neutral-200",
                    currentWidth === "half" && "border-black bg-neutral-50",
                  )}
                >
                  <ArrowsInLineHorizontal size={14} />
                  Half
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2">
            <div>
              <Label className="text-sm font-medium">Required</Label>
              <p className="text-[10px] text-neutral-400">
                Must be filled when creating a PO
              </p>
            </div>
            <Controller
              control={control}
              name="required"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-neutral-200"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white hover:bg-neutral-800"
            >
              {isSubmitting
                ? isEditing
                  ? "Updating…"
                  : "Creating…"
                : isEditing
                  ? "Update Field"
                  : "Add Field"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
