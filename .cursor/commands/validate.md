# validate
validate this update, check for potential problems, code duplication and redundant logs and temporary scripts.

- Run  `yarn tc` (or alternative command that works in current project) to check typescript and carefully fix all issues. Don't run if the project does not use typescript
- Fix logical bugs, edge cases, and regressions
- Check that the update added new logic but 100% preserved core existing logic
- Refactor code duplication introduced by these changes
- Remove redundant logs, debug statements, and temporary scripts
- Check for performance, security, and correctness issues caused by this update
- Review only files that differ from HEAD (git diff).
