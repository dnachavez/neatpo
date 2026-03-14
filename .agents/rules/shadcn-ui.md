---
description: Always use shadcn/ui for UI components — never build custom primitives from scratch
---

# shadcn/ui Component Standard

You MUST use **shadcn/ui** as the primary UI component library for this project. Do not build custom UI primitives from scratch when a shadcn/ui component exists.

---

## Project Configuration

This project uses the following shadcn/ui setup:

- **Style:** Base (Lyra preset)
- **Framework:** Next.js with React Server Components (`rsc: true`)
- **Language:** TypeScript (TSX)
- **Styling:** Tailwind CSS v4 with CSS variables
- **Icon Library:** Phosphor Icons
- **Component path:** `@/components/ui`
- **Utility path:** `@/lib/utils` (includes the `cn()` class merging helper)

---

## Rules

### 1. Always prefer shadcn/ui components

Before building any UI element, check if a shadcn/ui component exists for it. Common components include:

`Accordion`, `Alert`, `AlertDialog`, `Avatar`, `Badge`, `Breadcrumb`, `Button`, `Calendar`, `Card`, `Carousel`, `Chart`, `Checkbox`, `Collapsible`, `Combobox`, `Command`, `ContextMenu`, `DataTable`, `DatePicker`, `Dialog`, `Drawer`, `DropdownMenu`, `Form`, `HoverCard`, `Input`, `InputOTP`, `Label`, `Menubar`, `NavigationMenu`, `Pagination`, `Popover`, `Progress`, `RadioGroup`, `Resizable`, `ScrollArea`, `Select`, `Separator`, `Sheet`, `Sidebar`, `Skeleton`, `Slider`, `Sonner` (toast), `Switch`, `Table`, `Tabs`, `Textarea`, `Toast`, `Toggle`, `ToggleGroup`, `Tooltip`.

### 2. Install components before use

shadcn/ui components are **copied into the codebase**, not imported from a package. To add a new component:

```bash
npx shadcn@latest add <component-name>
```

This places the component in `src/components/ui/`. Never manually create files in this directory — always use the CLI.

### 3. Do not modify shadcn/ui component internals

- **Do not edit** files inside `src/components/ui/` directly unless absolutely necessary for project-wide customization.
- Instead, **compose and wrap** shadcn/ui components in your own components to add custom behavior or styling.
- If a style change is needed globally, prefer updating CSS variables in `src/app/globals.css` over editing component source files.

### 4. Use the `cn()` utility for class merging

Always use the `cn()` helper from `@/lib/utils` when combining Tailwind classes, especially when merging conditional or variant classes:

```tsx
import { cn } from "@/lib/utils";

<div className={cn("base-class", isActive && "active-class")} />
```

### 5. Use Phosphor Icons

This project uses **Phosphor Icons** as configured in shadcn/ui. Use Phosphor for all iconography — do not introduce additional icon libraries (Lucide, Heroicons, etc.) unless there is no Phosphor equivalent.

### 6. Follow the theming system

- All colors, radii, and spacing tokens are defined via **CSS variables** in `globals.css`.
- When customizing appearance, modify these CSS variables — do not hardcode color values or override Tailwind theme tokens inline.
- Respect the existing Lyra preset design language for visual consistency.

---

## What NOT to do

- ❌ Build a custom modal — use `Dialog` or `AlertDialog`
- ❌ Build a custom dropdown — use `DropdownMenu`, `Select`, or `Combobox`
- ❌ Build a custom tooltip — use `Tooltip`
- ❌ Build a custom toast system — use `Sonner`
- ❌ Build a custom tabs component — use `Tabs`
- ❌ Install a competing UI library (Material UI, Chakra, Ant Design, etc.)
- ❌ Use a different icon library instead of Phosphor Icons
