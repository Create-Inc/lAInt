import traverse from '@babel/traverse';
import type { File, IfStatement, Statement } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'no-silent-skip';

export const meta = {
  name: 'no-silent-skip',
  severity: 'warning' as const,
  platforms: null as Platform[] | null,
  category: 'Code Style',
  description: 'Add else branch with logging instead of silently skipping',
};

const EARLY_EXIT_TYPES = new Set([
  'ReturnStatement',
  'ThrowStatement',
  'ContinueStatement',
  'BreakStatement',
]);

function isEarlyExit(stmt: Statement): boolean {
  return EARLY_EXIT_TYPES.has(stmt.type);
}

function lastStatement(node: IfStatement): Statement | null {
  const consequent = node.consequent;
  if (consequent.type === 'BlockStatement') {
    const body = consequent.body;
    const last = body[body.length - 1];
    return last ?? null;
  }
  return consequent;
}

export function noSilentSkip(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    IfStatement(path) {
      // Already has an else branch — not a silent skip
      if (path.node.alternate) return;

      // Guard clause: consequent ends with early exit (return/throw/continue/break)
      const last = lastStatement(path.node);
      if (last && isEarlyExit(last)) return;

      // Skip if this is inside an else-if chain (parent is an IfStatement's alternate)
      if (path.parent.type === 'IfStatement' && path.parent.alternate === path.node) return;

      const { loc } = path.node;
      results.push({
        rule: RULE_NAME,
        message:
          'This if statement has no else branch. Add an else with logging to avoid silently skipping the falsy case',
        line: loc?.start.line ?? 0,
        column: loc?.start.column ?? 0,
        severity: 'warning',
      });
    },
  });

  return results;
}
