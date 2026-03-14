---
description: Enforce SOLID principles and separation of concerns in all code
---

# SOLID Principles & Separation of Concerns

You MUST strictly adhere to the following principles in all code you write, review, or refactor. Any violation should be flagged and corrected before finalizing changes.

---

## 1. Single Responsibility Principle (SRP)

- Every module, class, function, and component **must have one and only one reason to change**.
- If a function or class is doing more than one thing (e.g., fetching data AND formatting it AND rendering UI), **split it** into smaller, focused units.
- Name files, classes, and functions to clearly communicate their single purpose.

**Examples of violations to watch for:**
- A React component that fetches data, transforms it, and renders UI → split into a data-fetching hook, a transformer utility, and a presentational component.
- An API route handler that validates input, queries the database, applies business logic, and formats the response → split into validation middleware, a service layer, and a response formatter.

---

## 2. Open/Closed Principle (OCP)

- Code should be **open for extension but closed for modification**.
- Prefer composition, configuration, and polymorphism over modifying existing code to add new behavior.
- Use strategy patterns, plugin architectures, or dependency injection to allow behavior customization without altering core logic.

**In practice:**
- When adding a new variant or behavior, create a new module/class/component rather than adding conditional branches to an existing one.
- Use TypeScript interfaces and generics to define extensible contracts.

---

## 3. Liskov Substitution Principle (LSP)

- Subtypes and implementations **must be substitutable** for their base types without altering the correctness of the program.
- Derived classes or implementations must honor the contracts (preconditions, postconditions, invariants) of their parent types.
- Do not throw unexpected errors or change return types in subtype implementations.

**In practice:**
- If an interface defines a method returning `Promise<User>`, every implementation must return a valid `User` — never `null` unless the contract explicitly allows it.
- Avoid overriding methods in ways that break expectations set by the base class or interface.

---

## 4. Interface Segregation Principle (ISP)

- **No client should be forced to depend on methods it does not use.**
- Prefer many small, specific interfaces (or types) over a single large, monolithic one.
- Split broad interfaces into focused ones that each serve a single client need.

**In practice:**
- Instead of a single `UserService` interface with 20 methods, create `UserAuthService`, `UserProfileService`, `UserPreferencesService`, etc.
- Component props should only include the properties the component actually uses — avoid passing large, untyped objects.

---

## 5. Dependency Inversion Principle (DIP)

- High-level modules **must not depend on low-level modules**. Both should depend on abstractions (interfaces/types).
- Abstractions should not depend on details. Details should depend on abstractions.
- Use dependency injection to decouple modules from their concrete dependencies.

**In practice:**
- Business logic should depend on a `DatabasePort` interface, not directly on a Prisma/Drizzle/Mongoose client.
- React components should receive data through props or hooks — not reach into global state or import infrastructure directly.
- Test doubles (mocks, stubs) should be trivially substitutable for real implementations.

---

## 6. Separation of Concerns (SoC)

- Organize code into **distinct layers**, each responsible for a specific concern. Common layers include:
  - **Presentation** — UI components, views, layouts
  - **Application/Use Cases** — orchestration of business rules, workflows
  - **Domain/Business Logic** — core rules and entities, independent of frameworks
  - **Infrastructure** — databases, APIs, file systems, third-party integrations
- Never mix concerns within a single file, function, or class.
- Cross-cutting concerns (logging, auth, error handling) should be handled via middleware, decorators, or dedicated utility layers — not scattered throughout business logic.

**Directory structure guidance:**
- Group code **by feature or domain** (e.g., `features/auth/`, `features/billing/`) rather than by technical role alone (e.g., `components/`, `hooks/`, `utils/`).
- Within each feature, maintain clear separation between presentation, logic, and data access.

---

## Enforcement Checklist

Before finalizing any code change, verify:

- [ ] Each function/class/component has a single, clear responsibility
- [ ] New behavior is added via extension, not by modifying existing code where possible
- [ ] Subtypes and implementations are fully substitutable for their base types
- [ ] Interfaces and prop types are minimal and specific to their consumers
- [ ] High-level modules depend on abstractions, not concrete implementations
- [ ] Presentation, business logic, and infrastructure concerns are cleanly separated
- [ ] Cross-cutting concerns are centralized, not duplicated
