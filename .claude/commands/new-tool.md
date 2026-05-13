You are creating a new calculator tool for CFOforcreators.com.

Args: $ARGUMENTS (the tool slug, e.g., "expense-categorizer")

Steps:
1. Read `src/tools/tax-estimator.ts` to understand the ToolDefinition contract (or `src/tools/_types.ts` if no tool exists yet).
2. Create `src/tools/$ARGUMENTS.ts` following the same pattern. Required: every field on `ToolDefinition` including `verdict` logic in `renderResult`. If domain math is unclear, stub `compute()` and add a TODO with a question — do not invent.
3. Create `src/app/(tools)/$ARGUMENTS/page.tsx` (4 lines, copy from tax-estimator).
4. Create `src/app/(tools)/$ARGUMENTS/result/[id]/page.tsx` and `opengraph-image.tsx`.
5. Create `src/app/api/tools/$ARGUMENTS/route.ts` (POST inputs → save result).
6. Create `src/app/api/tools/$ARGUMENTS/follow-up/route.ts` (Anthropic streaming, copy from existing tool's follow-up route).
7. Add slug to `src/tools/_registry.ts` and `src/app/sitemap.ts`.
8. Create stub MDX in `src/content/learn/<explainerSlug>.mdx`.
9. Add unit test scaffold in `tests/unit/$ARGUMENTS.test.ts` with at least 3 known-good cases AND at least 1 case that produces verdict="no" (the brand-defining test).
10. Show the user a checklist of what's left (verify math, write 30+ test cases, add to cross-promo).

Voice rules apply to all generated copy — read CLAUDE.md voice section first. Honest "don't do it" verdict required where applicable.
