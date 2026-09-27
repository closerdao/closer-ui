# validate
validate this update, check for potential problems, code duplication and redundant logs and temporary scripts.

- Run  `cd apps/tdf && pnpm build` (or the equivalent for the app you're validating) to check typescript and carefully fix all issues. This is Next's own build-time typecheck, which is what CI relies on; `npx tsc --noEmit -p apps/tdf` also checks `__tests__/**`, which has pre-existing, unrelated type errors and isn't a reliable signal. Don't run if the project does not use typescript
- Fix logical bugs, edge cases, and regressions
- Check that the update added new logic but 100% preserved core existing logic
- Refactor code duplication introduced by these changes
- Remove redundant logs, debug statements, and temporary scripts
- Check for performance, security, and correctness issues caused by this update
- Review only files that differ from HEAD (git diff).
