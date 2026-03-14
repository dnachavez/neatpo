# Codebase Structure

## Frontend (src/)
- `src/app/` — Next.js App Router pages and layouts
  - `(dashboard)/` — Route group for authenticated dashboard
    - `purchase-orders/page.tsx` — Purchase orders page
    - `scan/page.tsx` — Scanning page
    - `documents/page.tsx` — Documents page
    - `layout.tsx` — Dashboard layout
    - `page.tsx` — Dashboard home
  - `login/page.tsx` — Login page
  - `layout.tsx` — Root layout
  - `globals.css` — Global styles (TailwindCSS)
- `src/features/` — Feature modules
  - `purchase-orders/` — PO management (types/po-schema, components/create-po-dialog, purchase-orders-table)
  - `auth/` — Authentication (types/login-schema, stores/auth-atoms, components/login-form, auth-guard)
  - `dashboard/` — Dashboard widgets (recent-activity, processing-status, overview-cards)
  - `documents/` — Document management (match-dialog, upload-zone, document-history-table)
- `src/components/` — Shared components
  - `ui/` — shadcn/ui components (button, card, dialog, table, sidebar, etc.)
  - `app-sidebar.tsx`, `dashboard-layout.tsx`, `convex-client-provider.tsx`, `progress-bar-provider.tsx`
- `src/hooks/` — `use-mobile.ts`
- `src/lib/` — `utils.ts` (clsx/tailwind-merge utility)
- `src/test/` — `setup.ts` (Vitest test setup)

## Backend (convex/)
- `schema.ts` — Database schema definition
- `auth.ts` — Authentication functions
- `users.ts` — User-related functions
- `purchaseOrders.ts` — Purchase order functions
- `suppliers.ts` — Supplier functions
- `documents.ts` — Document functions
- `seed.ts` — Seed data
- `_generated/` — Auto-generated Convex types and API
