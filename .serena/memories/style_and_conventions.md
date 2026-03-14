# Code Style & Conventions

## Formatting (Prettier)
- Semicolons: yes
- Quotes: double quotes
- Tab width: 2 spaces
- Trailing commas: all
- Print width: 80
- Bracket spacing: yes
- Line endings: LF
- TailwindCSS plugin enabled for class sorting

## TypeScript
- Strict mode enabled
- Target: ES2017
- Module: ESNext with bundler resolution
- JSX: react-jsx
- Path alias: `@/*` → `./src/*`

## Project Structure
```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── (dashboard)/        # Route group for authenticated dashboard pages
│   │   ├── purchase-orders/
│   │   ├── scan/
│   │   └── documents/
│   └── login/
├── features/               # Feature modules (feature-based architecture)
│   ├── purchase-orders/    # types/, components/, index.ts
│   ├── auth/               # types/, stores/, components/, index.ts
│   ├── dashboard/          # components/, index.ts
│   └── documents/          # components/, index.ts
├── components/             # Shared components
│   └── ui/                 # shadcn/ui components
├── hooks/                  # Shared hooks
├── lib/                    # Shared utilities
└── test/                   # Test setup
convex/                     # Convex backend (schema, functions)
```

## Naming Conventions
- Files: kebab-case (e.g., `create-po-dialog.tsx`, `po-schema.ts`)
- Components: PascalCase (e.g., `CreatePoDialog`, `LoginForm`)
- Atoms/stores: camelCase (e.g., `auth-atoms.ts`)
- Tests: `__tests__/` directories co-located with source, named `*.test.ts(x)`
- Barrel exports: `index.ts` per feature

## shadcn/ui Configuration
- Style: base-lyra
- Icon library: Phosphor
- CSS variables: enabled
- Base color: neutral
- RSC: enabled
