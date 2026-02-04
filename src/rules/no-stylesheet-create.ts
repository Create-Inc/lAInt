import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult } from '../types';

const RULE_NAME = 'no-stylesheet-create';

export function noStylesheetCreate(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    CallExpression(path) {
      const { callee, loc } = path.node;

      // Check for StyleSheet.create()
      if (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'StyleSheet' &&
        callee.property.type === 'Identifier' &&
        callee.property.name === 'create'
      ) {
        results.push({
          rule: RULE_NAME,
          message: 'Use inline styles instead of StyleSheet.create()',
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'warning',
        });
      }
    },
  });

  return results;
}
