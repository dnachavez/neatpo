# Project Overview: neatpo

## Purpose
NeatPO is a purchase order management web application for supply chain logistics. It provides a dashboard for managing purchase orders, document scanning with OCR, auto-matching documents to POs, interactive form building for custom PO fields, and analytics (spend & delivery).

## Tech Stack
- **Framework**: Next.js 16.1.6 (App Router, React Server Components enabled)
- **Language**: TypeScript 5 (strict mode)
- **React**: 19.2.3
- **Backend**: Convex (BaaS for database, real-time data, server functions)
- **UI Components**: shadcn/ui v4 (base-lyra style, Phosphor icons, cssVariables)
- **Styling**: TailwindCSS 4 with PostCSS
- **State Management**: Jotai (client-side atoms)
- **Server State**: TanStack Query v5
- **Forms**: React Hook Form v7 + Zod v4
- **Testing**: Vitest 4 + Testing Library (React, DOM, user-event) + jsdom
- **Linting**: ESLint 9 (next/core-web-vitals + next/typescript + prettier)
- **Formatting**: Prettier 3.8 (with tailwindcss plugin)
- **Animations**: tw-animate-css
- **Date Handling**: date-fns v4
- **Progress Bar**: @bprogress/next
- **Theme**: next-themes
- **Drag & Drop**: @dnd-kit (core, sortable, utilities) — used in field config manager
- **AI/OCR**: Google Generative AI (@google/generative-ai) — document OCR extraction

## Architecture
- Feature-based architecture under `src/features/`
- Each feature has its own `types/`, `components/`, `stores/`, `lib/`, and barrel `index.ts`
- Shared UI components in `src/components/ui/` (shadcn/ui)
- Shared layout components in `src/components/`
- Convex backend functions in `convex/` directory
- Path alias: `@/*` maps to `./src/*`

## Key Features
- **Purchase Order Management**: CRUD, status tracking (draft/processing/completed), search & filter
- **Document Scanning**: Upload/camera capture, OCR extraction via Google Gemini AI, review dialog
- **Auto-Matching**: Automatic document-to-PO matching by PO number or tracking number
- **Interactive Form Builder**: Drag-and-drop field config with live preview, custom field types (string/number/date)
- **Dashboard Analytics**: Overview cards, recent activity, processing status, spend analytics, delivery predictions
- **Authentication**: Login with session persistence, auth guards
