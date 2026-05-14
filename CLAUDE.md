# CLAUDE.md

## Project

laint is an AI Agent Lint Rules SDK — a programmatic API for linting JSX/TSX code, designed to integrate with Claude Code via PostToolUse hooks.

## Commands

- `npm run build` — compile TypeScript + fix ESM imports
- `npm test` — run vitest
- `npm run lint` — eslint + prettier check
- `npm run lint:fix` — auto-fix lint + formatting
- `npm run knip` — dead code detection

## Architecture

- `src/parser.ts` — Babel parser wrapper (JSX + TypeScript)
- `src/index.ts` — main API: `lintJsxCode()`, `getAllRuleNames()`
- `src/rules/` — individual lint rules, each a `RuleFunction(ast, code) => LintResult[]`
- `src/types.ts` — type definitions (`RuleFunction`, `LintResult`, etc.)
- `src/rules/index.ts` — rule registry (maps rule names to functions)
- `src/cli.ts` — CLI entry point (`laint init`, `laint check`)
- `src/cli/check.ts` — file mode and hook mode linting
- `src/cli/init.ts` — sets up `.claude/settings.json` PostToolUse hook

## Adding a new rule

1. Create `src/rules/my-rule.ts` exporting BOTH a `RuleFunction` and a `meta` object:

   ```ts
   export const meta = {
     name: 'my-rule',
     severity: 'error' as const,
     platforms: ['expo', 'web'] as Platform[] | null,
     category: 'React / JSX',
     description: 'One-line summary shown in README table',
   };

   export function myRule(ast: File, _code: string): LintResult[] { ... }
   ```

2. Create `tests/my-rule.test.ts`
3. Run `npm run sync` — regenerates `src/rules/index.ts` and the README rule tables from the per-rule `meta` exports
4. Run `npm test` to verify

That's it. The registry, README rule tables, platform tags, and rule count are all derived from the rule files. CI verifies `npm run sync` was run (no diff).

## Code style

- Strict TypeScript, ESM modules
- Prettier: 2 spaces, 100 char width, trailing commas, single quotes
- No unnecessary type assertions — use Babel's type system directly
