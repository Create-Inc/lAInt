import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'no-type-assertion';

export const meta = {
  name: 'no-type-assertion',
  severity: 'warning' as const,
  platforms: null as Platform[] | null,
  category: 'Code Style',
  description: 'Avoid `as` type casts; use type narrowing or proper types',
};

export function noTypeAssertion(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    TSAsExpression(path) {
      // Skip "as const" — it's idiomatic TypeScript for readonly literals
      if (path.node.typeAnnotation.type === 'TSTypeReference') {
        const typeName = path.node.typeAnnotation.typeName;
        if (typeName.type === 'Identifier' && typeName.name === 'const') {
          return;
        }
      }

      const { loc } = path.node;
      results.push({
        rule: RULE_NAME,
        message:
          'Avoid type assertions with "as". Use type narrowing, type guards, or proper typing instead',
        line: loc?.start.line ?? 0,
        column: loc?.start.column ?? 0,
        severity: 'warning',
      });
    },

    TSTypeAssertion(path) {
      const { loc } = path.node;
      results.push({
        rule: RULE_NAME,
        message:
          'Avoid angle-bracket type assertions. Use type narrowing, type guards, or proper typing instead',
        line: loc?.start.line ?? 0,
        column: loc?.start.column ?? 0,
        severity: 'warning',
      });
    },
  });

  return results;
}
