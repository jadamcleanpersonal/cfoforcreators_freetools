Add or update state-specific tax / business data.

Args: $ARGUMENTS (state code, e.g., "CA")

Steps:
1. Read `src/data/states.ts` and `src/lib/tax/states.ts` to see existing schema.
2. Verify the data against the state revenue department's official site (cite the URL in a comment next to the row).
3. Update both files in lockstep.
4. Run `pnpm test` to ensure no test scenarios break.
5. If anything looks ambiguous (e.g., conflicting sources), stop and add a TODO — don't guess on tax data.
