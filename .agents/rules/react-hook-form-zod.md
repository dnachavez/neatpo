---
description: Use React Hook Form with Zod for all form handling and validation
---

# React Hook Form + Zod Standard

You MUST use **React Hook Form** for all form state management and **Zod** for all schema validation. Do not use alternative form or validation libraries.

---

## Rules

### 1. Always use React Hook Form for forms

Every form in the application must use React Hook Form's `useForm` hook. Do not:

- Manage form state manually with `useState` per field.
- Use other form libraries (Formik, Final Form, etc.).
- Build custom form state management.

### 2. Always validate with Zod schemas

- Define a **Zod schema** for every form's data shape.
- Use `@hookform/resolvers/zod` to connect Zod schemas to React Hook Form.
- Reuse Zod schemas for both client-side validation and API request/response validation where applicable.

### 3. Standard form pattern

Every form must follow this structure:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// 1. Define the schema
const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

// 2. Infer the type from the schema — never define form types manually
type FormData = z.infer<typeof formSchema>;

// 3. Use the hook with the resolver
const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    email: "",
    name: "",
  },
});
```

### 4. Use shadcn/ui Form components

Integrate with shadcn/ui's `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, and `FormDescription` components for consistent UI. Install them via:

```bash
npx shadcn@latest add form
```

### 5. Infer types from Zod — never duplicate

- Always derive TypeScript types using `z.infer<typeof schema>`.
- Never manually write a TypeScript interface that mirrors a Zod schema.
- For API payloads, use `.parse()` or `.safeParse()` to validate at runtime.

### 6. Organize schemas

- **Feature-specific schemas** go in `src/features/<feature>/types/` or a dedicated `schemas.ts` file within the feature.
- **Shared schemas** (reused across features) go in `src/types/` or `src/lib/schemas.ts`.

---

## What NOT to do

- ❌ Use `useState` to track individual form fields
- ❌ Use Formik, Final Form, or any other form library
- ❌ Use Yup, Joi, or any other validation library
- ❌ Manually write TypeScript types that duplicate a Zod schema
- ❌ Validate form data with hand-written conditional logic
- ❌ Skip the `zodResolver` and handle validation manually in `onSubmit`
