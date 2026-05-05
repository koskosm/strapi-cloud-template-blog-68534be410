# Planning Rules

All plans except small/minor changes must be checked into `docs/plans/`. No exceptions.

## Plan Types

### Ephemeral Plan
For small, self-contained changes.

**Filename**: `docs/plans/YYYY-MM-DD-short-description.md`

**Required sections**:
- Goal (1–2 sentences)
- Changes (bulleted list of files/areas)
- Tests (behavioral requirements + checklist)
- Done criteria

### Execution Plan
For complex work spanning multiple steps or sessions.

**Filename**: `docs/plans/YYYY-MM-DD-short-description.md`

**Required sections**:
- Goal
- Context (why this work, what triggered it)
- Approach (detailed plan, with important code or algo)
- Decision Log (decisions made during execution, with rationale)
- Tests (behavioral requirements + TDD checklist)
- Done criteria

## TDD Requirements — Structural Boundary

Test-writing and implementation are **separate concerns** with an information barrier between them:

1. **Test specification receives ONLY behavioral requirements.**
2. **Tests must fail before implementation starts.**
3. **Implementation makes tests pass.**

### TDD section template (required in every plan)

```md
## Tests

### Behavioral requirements (for test author)
- [describe what the feature should do, not how]
- [describe edge cases and error conditions]

### Test checklist
- [ ] Tests written from behavioral requirements only
- [ ] Tests executed and confirmed failing (red)
- [ ] Implementation started only after red tests confirmed
- [ ] All tests passing after implementation (green)
```
