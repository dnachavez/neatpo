# Testing Patterns

## Setup
- **Framework**: Vitest 4 with jsdom environment
- **Libraries**: @testing-library/react, @testing-library/dom, @testing-library/user-event, @testing-library/jest-dom
- **Setup file**: `src/test/setup.ts` — imports `@testing-library/jest-dom/vitest` for DOM matchers

## Test Location
- Tests are co-located with source in `__tests__/` directories
- Naming convention: `*.test.ts` for logic, `*.test.tsx` for components

## Existing Test Coverage
- `src/features/auth/types/__tests__/login-schema.test.ts` — Login schema validation
- `src/features/auth/components/__tests__/login-form.test.tsx` — Login form component
- `src/features/auth/components/__tests__/auth-guard.test.tsx` — Auth guard component
- `src/features/purchase-orders/types/__tests__/po-schema.test.ts` — PO schema validation
- `src/features/documents/types/__tests__/document-schema.test.ts` — Document schema validation
- `src/features/documents/lib/__tests__/auto-match.test.ts` — Auto-match logic
- `src/features/fields/components/__tests__/add-field-dialog.test.tsx` — Add field dialog component
- `src/hooks/__tests__/use-mobile.test.ts` — useMobile responsive hook

## Commands
- `npm test` — Vitest in watch mode
- `npm run test:run` — Single run
- `npm run test:coverage` — With coverage report

## Conventions
- Schema tests validate success and failure cases for Zod schemas
- Component tests render with Testing Library, simulate user events
- Logic tests (like auto-match) test pure functions with various input scenarios
- Hook tests validate custom React hooks
- Convex backend functions are not unit-tested directly (no Convex test harness set up)
