import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult } from '../types';

const RULE_NAME = 'no-require-statements';

export function noRequireStatements(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    CallExpression(path) {
      const { callee, loc } = path.node;

      if (callee.type === 'Identifier' && callee.name === 'require') {
        results.push({
          rule: RULE_NAME,
          message: 'Use import statements instead of require()',
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'error',
        });
      }
    },
  });

  return results;
}
