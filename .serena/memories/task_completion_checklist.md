# Task Completion Checklist

When a task is completed, the following steps should be performed:

1. **Format code**: `npm run format` — ensure all files are formatted with Prettier
2. **Lint check**: `npm run lint` — ensure no ESLint errors
3. **Run tests**: `npm run test:run` — ensure all tests pass
4. **Build check**: `npm run build` — ensure the project builds without errors (if structural changes were made)
5. **Verify Convex**: Ensure Convex dev server (`npx convex dev`) shows no schema or function errors (if backend changes were made)
