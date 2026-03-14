---
description: Use Jotai for all client-side state management
---

# Jotai State Management Standard

You MUST use **Jotai** for all client-side state management. Do not use alternative state management libraries for client state.

---

## Core Distinction: Client State vs. Server State

- **Client state** (UI state, user preferences, local toggles, wizard steps, theme) → **Jotai**
- **Server state** (API data, remote resources) → **TanStack Query** (see the TanStack Query rule)

Never mix these concerns. Jotai atoms must not store data fetched from APIs — that is TanStack Query's responsibility.

---

## Rules

### 1. Use atoms for all shared client state

Any client state shared across components must be stored in Jotai atoms. Do not:

- Use React Context + `useReducer` for state management.
- Use Redux, Zustand, MobX, or any other state library.
- Prop-drill deeply when an atom would be cleaner.

Component-local state (`useState`) is still appropriate for truly local, non-shared UI state (e.g., whether a single dropdown is open).

### 2. Atom design patterns

```tsx
import { atom } from "jotai";

// Primitive atom — simple read/write state
export const sidebarOpenAtom = atom(false);

// Read-only derived atom — computed from other atoms
export const fullNameAtom = atom((get) => {
  const first = get(firstNameAtom);
  const last = get(lastNameAtom);
  return `${first} ${last}`;
});

// Read-write derived atom — with custom setter logic
export const themeAtom = atom(
  (get) => get(baseThemeAtom),
  (get, set, newTheme: Theme) => {
    set(baseThemeAtom, newTheme);
    localStorage.setItem("theme", newTheme);
  }
);
```

### 3. Keep atoms granular

- Prefer many small, focused atoms over a few large ones.
- Each atom should represent a **single piece of state**.
- Use derived atoms to compute combined values instead of storing redundant data.

### 4. Organize atoms by scope

- **Feature-scoped atoms** go in `src/features/<feature>/store/`.
- **Global atoms** (theme, sidebar state, auth status flags) go in `src/store/`.
- Name atom files descriptively: `sidebarAtoms.ts`, `themeAtoms.ts`, `authAtoms.ts`.

### 5. Use Jotai utilities when appropriate

Leverage Jotai's ecosystem for common patterns:

- `atomWithStorage` — for persisting state to localStorage/sessionStorage.
- `atomWithReset` — for resettable atoms.
- `selectAtom` — for selecting slices of an atom to avoid unnecessary re-renders.
- `atomFamily` — for parameterized atoms (e.g., per-entity state).

### 6. Access atoms with standard hooks

```tsx
import { useAtom, useAtomValue, useSetAtom } from "jotai";

// Read and write
const [value, setValue] = useAtom(myAtom);

// Read only (component won't re-render on writes)
const value = useAtomValue(myAtom);

// Write only (component won't re-render on value changes)
const setValue = useSetAtom(myAtom);
```

Use `useAtomValue` and `useSetAtom` to minimize unnecessary re-renders when a component only needs to read or write.

---

## What NOT to do

- ❌ Use Redux, Zustand, MobX, Recoil, or any other state management library
- ❌ Use React Context + `useReducer` as a state management solution
- ❌ Store server/API data in Jotai atoms (use TanStack Query instead)
- ❌ Create monolithic atoms that hold large, unrelated state objects
- ❌ Prop-drill extensively when an atom would simplify the data flow
