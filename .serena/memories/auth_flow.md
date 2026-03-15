# Authentication Flow

## Backend (convex/auth.ts)
- `login` mutation — validates email/password against hashed password, returns user object on success

## Frontend State (Jotai)
- `authUserAtom` — persisted atom via `atomWithStorage` (localStorage key: `neatpo_auth_user`)
  - `getOnInit: true` — reads storage synchronously on app load for session persistence
- `isAuthenticatedAtom` — derived atom, returns `true` if `authUserAtom` is not null
- Type: `AuthUser` = `{ _id, name, email, role }`

## Components
- `login-form.tsx` — login form with email/password fields (React Hook Form + Zod validation)
- `auth-guard.tsx` — route protection component, redirects unauthenticated users to `/login`

## Session Persistence
- Auth state persists across page refreshes via localStorage (`neatpo_auth_user` key)
- `atomWithStorage` with `getOnInit: true` ensures no flash of unauthenticated state
- No token-based session — stores user object directly in localStorage

## Routes
- `/login` — public login page
- `/(dashboard)/*` — all protected by `AuthGuard` in dashboard layout

## Key Files
- `convex/auth.ts` — `login` mutation
- `src/features/auth/stores/auth-atoms.ts` — `authUserAtom`, `isAuthenticatedAtom`, `AuthUser` type
- `src/features/auth/components/login-form.tsx` — Login form
- `src/features/auth/components/auth-guard.tsx` — Route guard
- `src/features/auth/types/login-schema.ts` — Zod validation schema for login
