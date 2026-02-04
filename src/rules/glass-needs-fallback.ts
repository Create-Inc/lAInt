import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult } from '../types';

const RULE_NAME = 'glass-needs-fallback';

export function glassNeedsFallback(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  let hasGlassViewUsage = false;
  let hasLiquidGlassCheck = false;
  let glassViewLoc: { line: number; column: number } | null = null;

  traverse(ast, {
    JSXOpeningElement(path) {
      const { name, loc } = path.node;

      if (name.type === 'JSXIdentifier' && name.name === 'GlassView') {
        hasGlassViewUsage = true;
        if (!glassViewLoc) {
          glassViewLoc = {
            line: loc?.start.line ?? 0,
            column: loc?.start.column ?? 0,
          };
        }
      }
    },

    CallExpression(path) {
      const { callee } = path.node;

      // Check for isLiquidGlassAvailable() call
      if (
        callee.type === 'Identifier' &&
        callee.name === 'isLiquidGlassAvailable'
      ) {
        hasLiquidGlassCheck = true;
      }
    },
  });

  if (hasGlassViewUsage && !hasLiquidGlassCheck && glassViewLoc !== null) {
    const { line, column } = glassViewLoc;
    results.push({
      rule: RULE_NAME,
      message:
        'GlassView requires fallback UI. Use isLiquidGlassAvailable() to check support before rendering GlassView',
      line,
      column,
      severity: 'warning',
    });
  }

  return results;
}
