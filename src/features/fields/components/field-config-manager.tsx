"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DotsSixVertical,
  Trash,
  ArrowsOutLineHorizontal,
  ArrowsInLineHorizontal,
  PencilSimple,
  TextT,
  Hash,
  CalendarBlank,
  Plus,
  Eye,
  ToggleLeft,
  EnvelopeSimple,
  Phone,
  LinkSimple,
  TextAlignLeft,
  CurrencyDollar,
  CaretDown,
  Clock,
  CalendarDots,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { AddFieldDialog } from "./add-field-dialog";

type FieldConfig = {
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
  order: number;
  width: "full" | "half";
  options?: string[];
};

const typeIcons: Record<
  string,
  React.ComponentType<{ size: number; className?: string }>
> = {
  string: TextT,
  number: Hash,
  date: CalendarBlank,
  boolean: ToggleLeft,
  email: EnvelopeSimple,
  phone: Phone,
  url: LinkSimple,
  textarea: TextAlignLeft,
  currency: CurrencyDollar,
  select: CaretDown,
  time: Clock,
  datetime: CalendarDots,
};

const typeLabels: Record<string, string> = {
  string: "Text",
  number: "Number",
  date: "Date",
  boolean: "Yes / No",
  email: "Email",
  phone: "Phone",
  url: "URL",
  textarea: "Long Text",
  currency: "Currency",
  select: "Dropdown",
  time: "Time",
  datetime: "Date & Time",
};

// --- Sortable Field Item ---
function SortableFieldItem({
  field,
  onToggleWidth,
  onDelete,
  onEdit,
}: {
  field: FieldConfig;
  onToggleWidth: (id: Id<"fieldConfigs">, newWidth: "full" | "half") => void;
  onDelete: (id: Id<"fieldConfigs">) => void;
  onEdit: (field: FieldConfig) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const TypeIcon = typeIcons[field.type] ?? TextT;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 transition-shadow",
        isDragging && "z-50 shadow-lg ring-2 ring-black/10",
        field.width === "half" ? "min-w-0 flex-1" : "w-full",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-neutral-300 transition-colors hover:text-neutral-500 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <DotsSixVertical size={18} weight="bold" />
      </button>

      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-100">
        <TypeIcon size={13} className="text-neutral-500" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-black">
            {field.label}
          </span>
          {field.required && (
            <span className="text-destructive text-xs font-bold">*</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-neutral-400">{field.key}</span>
          <Badge
            variant="outline"
            className="px-1 py-0 text-[9px] text-neutral-400"
          >
            {typeLabels[field.type]}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "px-1 py-0 text-[9px]",
              field.width === "half"
                ? "border-blue-200 text-blue-600"
                : "border-neutral-200 text-neutral-400",
            )}
          >
            {field.width === "half" ? "½ width" : "Full"}
          </Badge>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onEdit(field)}
          className="text-neutral-400 hover:text-black"
          title="Edit field"
        >
          <PencilSimple size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() =>
            onToggleWidth(field._id, field.width === "full" ? "half" : "full")
          }
          className="text-neutral-400 hover:text-black"
          title={field.width === "full" ? "Make half width" : "Make full width"}
        >
          {field.width === "full" ? (
            <ArrowsInLineHorizontal size={14} />
          ) : (
            <ArrowsOutLineHorizontal size={14} />
          )}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                className="hover:text-destructive text-neutral-400"
                title="Delete field"
              />
            }
          >
            <Trash size={14} />
          </AlertDialogTrigger>
          <AlertDialogContent className="border-neutral-200 bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete &ldquo;{field.label}&rdquo;?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the field from your PO form. Existing purchase
                orders that used this field will not be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-neutral-200">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90 text-white"
                onClick={() => onDelete(field._id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// --- Live Preview ---
function FormPreview({ fields }: { fields: FieldConfig[] }) {
  // Group half-width fields into pairs for the preview
  const rows: FieldConfig[][] = [];
  let pendingHalf: FieldConfig | null = null;

  for (const field of fields) {
    if (field.width === "half") {
      if (pendingHalf) {
        rows.push([pendingHalf, field]);
        pendingHalf = null;
      } else {
        pendingHalf = field;
      }
    } else {
      if (pendingHalf) {
        rows.push([pendingHalf]);
        pendingHalf = null;
      }
      rows.push([field]);
    }
  }
  if (pendingHalf) {
    rows.push([pendingHalf]);
  }

  return (
    <div className="space-y-3">
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className={cn("flex gap-3", row.length === 2 && "flex-row")}
        >
          {row.map((field) => (
            <div
              key={field._id}
              className={cn(
                "space-y-1",
                row.length === 2 ? "flex-1" : "w-full",
              )}
            >
              <label className="text-xs font-medium text-neutral-600">
                {field.label}
                {field.required && (
                  <span className="text-destructive ml-0.5">*</span>
                )}
              </label>
              <div
                className={cn(
                  "h-9 rounded-md border border-neutral-200 bg-neutral-50/50 px-3",
                  "flex items-center text-xs text-neutral-300",
                )}
              >
                {field.type === "date"
                  ? "YYYY-MM-DD"
                  : field.type === "number"
                    ? "0"
                    : field.type === "boolean"
                      ? "Yes / No"
                      : field.type === "email"
                        ? "name@example.com"
                        : field.type === "phone"
                          ? "+1 (555) 000-0000"
                          : field.type === "url"
                            ? "https://"
                            : field.type === "textarea"
                              ? "Enter long text…"
                              : field.type === "currency"
                                ? "0.00"
                                : field.type === "select"
                                  ? "Select an option…"
                                  : field.type === "time"
                                    ? "HH:MM"
                                    : field.type === "datetime"
                                      ? "YYYY-MM-DD HH:MM"
                                      : `Enter ${field.label.toLowerCase()}…`}
              </div>
            </div>
          ))}
        </div>
      ))}
      {fields.length === 0 && (
        <div className="flex flex-col items-center py-8 text-center">
          <p className="text-sm text-neutral-400">
            No fields yet. Add fields to see the form preview.
          </p>
        </div>
      )}
    </div>
  );
}

// --- Main Component ---
export function FieldConfigManager() {
  const currentUser = useQuery(api.users.getByEmail, {
    email: "staff@neatpo.app",
  });
  const fieldConfigs = useQuery(
    api.fieldConfigs.list,
    currentUser?._id ? { userId: currentUser._id } : "skip",
  );
  const updateField = useMutation(api.fieldConfigs.update);
  const deleteField = useMutation(api.fieldConfigs.remove);
  const reorderFields = useMutation(api.fieldConfigs.reorder);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editField, setEditField] = useState<FieldConfig | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const isLoading = fieldConfigs === undefined;
  const fields = fieldConfigs ?? [];

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f._id === active.id);
    const newIndex = fields.findIndex((f) => f._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(fields, oldIndex, newIndex);

    try {
      await reorderFields({
        items: reordered.map((f, idx) => ({
          id: f._id,
          order: idx,
        })),
      });
    } catch {
      toast.error("Failed to reorder fields");
    }
  }

  async function handleToggleWidth(
    id: Id<"fieldConfigs">,
    newWidth: "full" | "half",
  ) {
    try {
      await updateField({ id, width: newWidth });
    } catch {
      toast.error("Failed to update field width");
    }
  }

  async function handleDelete(id: Id<"fieldConfigs">) {
    try {
      await deleteField({ id });
      toast.success("Field deleted");
    } catch {
      toast.error("Failed to delete field");
    }
  }

  function handleEdit(field: FieldConfig) {
    setEditField(field);
    setAddDialogOpen(true);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Field List — Drag & Drop */}
      <Card className="border-neutral-200 bg-white shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
              Form Fields
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowPreview(!showPreview)}
                className={cn(
                  "text-neutral-400 hover:text-black lg:hidden",
                  showPreview && "text-black",
                )}
              >
                <Eye size={14} />
                {showPreview ? "Editor" : "Preview"}
              </Button>
              <Button
                size="xs"
                className="bg-black text-white hover:bg-neutral-800"
                onClick={() => {
                  setEditField(null);
                  setAddDialogOpen(true);
                }}
              >
                <Plus size={14} weight="bold" />
                Add Field
              </Button>
            </div>
          </div>
          <p className="text-xs text-neutral-400">
            Drag to reorder. Click the width icon to toggle half/full width.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : fields.length === 0 ? (
            <div className="flex flex-col items-center rounded-lg border-2 border-dashed border-neutral-200 py-12">
              <TextT size={32} className="mb-2 text-neutral-200" />
              <p className="text-sm text-neutral-400">
                No fields configured yet
              </p>
              <p className="mt-1 text-xs text-neutral-300">
                Add fields to build your purchase order form
              </p>
              <Button
                size="xs"
                className="mt-4 bg-black text-white hover:bg-neutral-800"
                onClick={() => {
                  setEditField(null);
                  setAddDialogOpen(true);
                }}
              >
                <Plus size={14} weight="bold" />
                Add your first field
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map((f) => f._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5">
                  {fields.map((field) => (
                    <SortableFieldItem
                      key={field._id}
                      field={field}
                      onToggleWidth={handleToggleWidth}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card
        className={cn(
          "border-neutral-200 bg-white shadow-none",
          showPreview ? "block lg:block" : "hidden lg:block",
        )}
      >
        <CardHeader>
          <CardTitle className="font-serif text-lg font-normal tracking-tight text-black">
            Form Preview
          </CardTitle>
          <p className="text-xs text-neutral-400">
            How the PO creation form will look based on your layout
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/30 p-4">
            <FormPreview fields={fields} />
          </div>
        </CardContent>
      </Card>

      <AddFieldDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        editField={editField}
        fieldCount={fields.length}
      />
    </div>
  );
}
