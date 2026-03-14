---
description: Use TanStack Query for all server state management and data fetching
---

# TanStack Query Standard

You MUST use **TanStack Query (React Query)** for all server state — data fetching, caching, synchronization, and mutations. Do not use alternative data-fetching patterns for server state.

---

## Rules

### 1. All server state goes through TanStack Query

Any data that originates from an API or external source must be managed with TanStack Query hooks:

- **`useQuery`** — for fetching/reading data.
- **`useMutation`** — for creating, updating, and deleting data.
- **`useInfiniteQuery`** — for paginated or infinite scroll data.
- **`useSuspenseQuery`** — for Suspense-based data fetching in RSC-compatible components.

Do not use raw `fetch` or `axios` calls inside components with manual `useState`/`useEffect` patterns.

### 2. Define query keys consistently

Use structured, hierarchical query key arrays for predictable cache management:

```tsx
// Good: structured keys
["users"]                      // all users
["users", userId]              // single user
["users", userId, "posts"]     // user's posts
["users", { status: "active" }] // filtered users

// Bad: flat strings
"users"
"user-123"
```

Create a query key factory per feature for consistency:

```tsx
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};
```

### 3. Separate query/mutation functions from hooks

Extract the actual API call into a standalone service function. The hook should only orchestrate:

```tsx
// services/userService.ts — pure API call
export async function fetchUser(id: string): Promise<User> {
  const res = await api.get(`/users/${id}`);
  return res.data;
}

// hooks/useUser.ts — TanStack Query hook
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => fetchUser(id),
  });
}
```

### 4. Invalidate and update cache properly

- After mutations, use `queryClient.invalidateQueries()` to refetch stale data.
- For optimistic updates, use the `onMutate` / `onError` / `onSettled` pattern.
- Never manually set query data as a replacement for proper invalidation unless implementing optimistic UI.

### 5. Organize by feature

- **Feature-specific** query hooks go in `src/features/<feature>/hooks/`.
- **Feature-specific** query key factories go in `src/features/<feature>/services/` or `types/`.
- **Shared** data hooks (if any) go in `src/hooks/`.

### 6. Configure the QueryClient at the app root

Set up a single `QueryClientProvider` at the application root with sensible defaults (stale time, retry, refetch behavior). Do not create multiple `QueryClient` instances.

---

## What NOT to do

- ❌ Use `useEffect` + `useState` + `fetch` for data loading
- ❌ Use SWR, RTK Query, Apollo, or any other data-fetching library
- ❌ Store server data in Jotai or other client state managers
- ❌ Use string-based query keys instead of structured arrays
- ❌ Call API functions directly inside components without a TanStack Query wrapper
- ❌ Forget to invalidate queries after mutations
