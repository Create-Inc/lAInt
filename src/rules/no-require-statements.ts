import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'no-require-statements';

export const meta = {
  name: 'no-require-statements',
  severity: 'error' as const,
  platforms: ['backend'] as Platform[] | null,
  category: 'Backend / SQL',
  description: 'Use ES imports, not CommonJS require',
};

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
