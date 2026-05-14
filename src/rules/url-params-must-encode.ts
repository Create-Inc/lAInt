import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'url-params-must-encode';

export const meta = {
  name: 'url-params-must-encode',
  severity: 'warning' as const,
  platforms: null as Platform[] | null,
  category: 'URL',
  description: 'URL query param values must be wrapped in encodeURIComponent()',
};

export function urlParamsMustEncode(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    TemplateLiteral(path) {
      const { quasis, expressions } = path.node;

      for (let i = 0; i < expressions.length; i++) {
        const expr = expressions[i];
        const precedingQuasi = quasis[i];
        const rawBefore = precedingQuasi.value.raw;

        // Check if the preceding text ends with a URL query param pattern: ?key= or &key=
        if (!/[?&][a-zA-Z_][a-zA-Z0-9_]*=$/.test(rawBefore)) continue;

        // Check if the expression is wrapped in encodeURIComponent()
        if (
          t.isCallExpression(expr) &&
          t.isIdentifier(expr.callee, { name: 'encodeURIComponent' })
        ) {
          continue;
        }

        // Also allow function calls wrapping encodeURIComponent, e.g. String(encodeURIComponent(...))
        if (t.isCallExpression(expr)) {
          const arg = expr.arguments[0];
          if (
            arg &&
            t.isCallExpression(arg) &&
            t.isIdentifier(arg.callee, { name: 'encodeURIComponent' })
          ) {
            continue;
          }
        }

        const { loc } = expr;
        results.push({
          rule: RULE_NAME,
          message:
            'URL query parameter value should be wrapped in encodeURIComponent() to prevent malformed URLs.',
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'warning',
        });
      }
    },
  });

  return results;
}
