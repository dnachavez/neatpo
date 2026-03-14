---
trigger: model_decision
description: Use Convex as the backend-as-a-service for all backend logic, database, and real-time data
---

# Convex Backend-as-a-Service Standard

You MUST use **Convex** as the sole backend for this project. All database operations, server-side logic, and real-time data synchronization must go through Convex. Do not introduce a separate backend server, ORM, or database.

---

## Project Configuration

- **Convex functions directory:** `convex/`
- **Schema definition:** `convex/schema.ts`
- **Client provider:** `src/components/convex-client-provider.tsx` (wraps the app with `ConvexProvider`)
- **Environment variable:** `NEXT_PUBLIC_CONVEX_URL` (set in `.env.local`)
- **Generated types:** `convex/_generated/` (auto-generated — never edit manually)

---

## Rules

### 1. All backend logic lives in `convex/`

Every database query, mutation, action, and server-side function must be defined inside the `convex/` directory. Do not:

- Create API routes in Next.js `app/api/` for data operations that Convex can handle.
- Write server-side data logic outside of `convex/`.
- Connect to external databases directly — use Convex as the database.

### 2. Use the correct function types

Convex provides three function types — use the right one:

| Function Type | Use For                            | Has DB Access                        | Can Call External APIs |
| ------------- | ---------------------------------- | ------------------------------------ | ---------------------- |
| `query`       | Reading data (reactive, real-time) | ✅                                   | ❌                     |
| `mutation`    | Writing data (transactional)       | ✅                                   | ❌                     |
| `action`      | Side effects, external API calls   | Via `ctx.runQuery`/`ctx.runMutation` | ✅                     |

```tsx
import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";

// Query — reactive, re-runs automatically when data changes
export const listTasks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});

// Mutation — transactional write
export const createTask = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("tasks", { text: args.text, isCompleted: false });
  },
});

// Action — for external API calls or side effects
export const sendNotification = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getUser, {
      id: args.userId,
    });
    // Call external API here
  },
});
```

### 3. Define the schema in `convex/schema.ts`

All tables must be defined in the central schema file using Convex's `defineSchema` and `defineTable`:

```tsx
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),
});
```

- Always define indexes for fields you query or filter by.
- Use `v.id("tableName")` for foreign key references.
- Use Convex validators (`v.string()`, `v.number()`, `v.boolean()`, `v.optional()`, etc.) — not Zod — for Convex function argument and schema validation.

### 4. Use Convex React hooks on the client

Use Convex's React hooks for data access in components:

```tsx
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

// Reactive query — automatically updates when data changes
const tasks = useQuery(api.tasks.listTasks);

// Mutation caller
const createTask = useMutation(api.tasks.createTask);

// Action caller
const sendEmail = useAction(api.notifications.sendNotification);
```

- **`useQuery`** returns `undefined` while loading — handle this loading state gracefully.
- Always import from the generated `api` object for full type safety.
- Convex queries are **real-time by default** — no manual refetching or cache invalidation needed.

### 5. Organize Convex functions logically

Structure `convex/` files by domain/feature:

```
convex/
  schema.ts          # Central schema definition
  tasks.ts           # Task-related queries, mutations, actions
  users.ts           # User-related functions
  notifications.ts   # Notification-related functions
  _generated/        # Auto-generated (never edit)
```

For internal functions not exposed to the client, use `internalQuery`, `internalMutation`, and `internalAction`.

### 6. Convex + TanStack Query boundary

Since Convex provides its own real-time reactive queries via `useQuery`:

- Use **Convex `useQuery`** for all data stored in the Convex database.
- Use **TanStack Query** only for data from **third-party external APIs** that are not proxied through Convex.
- Do not wrap Convex queries in TanStack Query — Convex handles caching and reactivity natively.

### 7. Never edit `_generated/`

The `convex/_generated/` directory is auto-generated by the Convex CLI. Never manually edit files in this directory. They are regenerated on every `npx convex dev` run.

---

## What NOT to do

- ❌ Create Next.js API routes (`app/api/`) for data operations Convex can handle
- ❌ Use a separate database (PostgreSQL, MongoDB, etc.)
- ❌ Use an ORM (Prisma, Drizzle, etc.)
- ❌ Edit files in `convex/_generated/`
- ❌ Use Zod validators inside Convex function `args` — use Convex's `v` validators
- ❌ Wrap Convex `useQuery` calls in TanStack Query
- ❌ Manually refetch Convex queries — they are reactive and update automatically
