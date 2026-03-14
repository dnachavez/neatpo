---
description: Enforce feature-driven architecture with strict separation between global and feature-specific resources
---

# Feature-Driven Architecture

You MUST follow this architecture for all code organization. Every file must live in the correct location based on whether it is **shared globally** or **scoped to a specific feature**.

---

## Global Directories (Root Level)

These directories under `src/` contain **shared resources used across multiple features**. A resource belongs here ONLY if it is consumed by two or more features.

```
src/
  components/     # Shared UI components (buttons, modals, layouts, etc.)
  hooks/          # Shared React hooks (useDebounce, useMediaQuery, etc.)
  lib/            # Shared libraries and utilities (API clients, configs)
  services/       # Shared services (HTTP client, auth service, etc.)
  store/          # Global state management (app-wide stores/slices)
  types/          # Shared TypeScript types and interfaces
  utils/          # Shared pure utility functions (formatters, validators)
```

### Rules for global directories:

- **Only truly shared code belongs here.** If a utility, component, or hook is only used by one feature, it belongs inside that feature's directory.
- When a resource starts as feature-specific but later becomes needed by a second feature, **promote it** to the global directory at that point — not preemptively.
- Global resources must be **generic and reusable**. They must not contain feature-specific business logic.

---

## Feature Directories

Each feature is **self-contained** under `src/features/<feature-name>/` with its own complete internal structure:

```
src/
  features/
    <feature-name>/
      components/   # Feature-specific UI components
      hooks/        # Feature-specific React hooks
      lib/          # Feature-specific libraries
      services/     # Feature-specific services and API calls
      store/        # Feature-specific state management
      types/        # Feature-specific TypeScript types
      utils/        # Feature-specific utility functions
```

### Rules for feature directories:

- **A feature must never import from another feature.** If two features need to share code, that code must be promoted to a global directory.
- Each feature directory should be **independently understandable**. A developer should be able to read a single feature folder and understand its full scope.
- Not every subdirectory is required — only create the subdirectories a feature actually needs. Do not create empty placeholder directories.
- Feature directories can have an `index.ts` barrel file that exports the feature's public API (the components and hooks other parts of the app are allowed to use).

---

## Import Rules

| From | Can import from | CANNOT import from |
|---|---|---|
| Feature A | Global `src/*` dirs | Feature B, Feature C, etc. |
| Global `src/*` dirs | Other global `src/*` dirs | Any `src/features/*` |
| App routes/pages | Global dirs + any feature's public API | Feature internals directly |

### Key constraints:

1. **No cross-feature imports.** `src/features/auth/` must never import from `src/features/dashboard/`. Extract shared logic to a global directory instead.
2. **No reverse dependencies.** Global directories must never import from feature directories. The dependency arrow always points inward: features → global.
3. **Pages/routes are consumers.** Route-level files (e.g., Next.js `app/` pages) may import from both global directories and feature public APIs, but should contain minimal logic themselves.

---

## When to Create a New Feature

Create a new feature directory when:

- You are building a **distinct, cohesive area of functionality** (e.g., authentication, billing, onboarding, settings).
- The functionality has its own UI, state, services, or business logic that can be encapsulated.
- The code would otherwise bloat an existing feature with unrelated concerns.

Do NOT create a new feature directory for:

- A single utility function → goes in global `utils/`.
- A single shared component → goes in global `components/`.
- A trivial wrapper → consider if it belongs in an existing feature.

---

## Promotion Protocol

When feature-specific code needs to be shared:

1. **Identify** the resource that a second feature now needs.
2. **Move** it from `src/features/<feature>/` to the appropriate global directory (e.g., `src/components/`, `src/hooks/`).
3. **Update all imports** across the codebase to reflect the new location.
4. **Remove any feature-specific business logic** from the promoted resource — it must be generic.
5. **Verify** that no circular or reverse dependencies were introduced.

---

## Enforcement Checklist

Before finalizing any code change, verify:

- [ ] New code is placed in the correct directory (global vs. feature-specific)
- [ ] No cross-feature imports exist
- [ ] Global directories do not import from any feature
- [ ] Feature-specific code is not prematurely placed in global directories
- [ ] Promoted code has been made generic and all imports updated
