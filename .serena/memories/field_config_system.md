# Field Configuration System (Form Builder)

## Purpose
Allows users to customize the PO creation form by adding, editing, removing, and reordering custom fields. Supports drag-and-drop reordering and layout control (full-width vs half-width).

## Field Types
- `string` — text input
- `number` — numeric input
- `date` — date picker
- `boolean` — yes/no switch
- `email` — email input
- `phone` — phone input
- `url` — URL input
- `textarea` — multi-line text
- `currency` — currency amount (number with 0.01 step)
- `select` — dropdown with configurable options (stored as `options: string[]` in fieldConfigs)
- `time` — time picker
- `datetime` — date & time picker

## Field Properties
- `label` — display name
- `key` — unique identifier (per user)
- `type` — string | number | date | boolean | email | phone | url | textarea | currency | select | time | datetime
- `required` — whether the field is mandatory
- `order` — sort position for rendering
- `width` — "full" (100%) or "half" (50%)
- `isDefault` — marks system-provided default fields

## Backend (convex/fieldConfigs.ts)
- `create` — create a new field config (user-scoped)
- `list` — list field configs for the current user
- `update` — update field properties
- `remove` — delete a field config
- `reorder` — batch update sort order after drag-and-drop

## Frontend Components
- `FieldConfigManager` — main manager with DnD (uses @dnd-kit), live form preview
- `AddFieldDialog` — dialog for creating/editing fields
- `FormPreview` — live preview of the form layout (inside FieldConfigManager)
- `SortableFieldItem` — individual draggable field card (inside FieldConfigManager)

## Integration with PO Creation
- `create-po-dialog.tsx` dynamically fetches field configs and renders the form accordingly
- Custom field values are stored as JSON string in `purchaseOrders.customFields`

## Key Files
- `convex/fieldConfigs.ts` — Backend CRUD + reorder
- `src/features/fields/components/field-config-manager.tsx` — DnD manager + preview
- `src/features/fields/components/add-field-dialog.tsx` — Add/edit dialog
- `src/features/purchase-orders/components/create-po-dialog.tsx` — Consumes field configs
- `src/app/(dashboard)/fields/page.tsx` — Fields page route
