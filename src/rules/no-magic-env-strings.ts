import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'no-magic-env-strings';

export const meta = {
  name: 'no-magic-env-strings',
  severity: 'warning' as const,
  platforms: null as Platform[] | null,
  category: 'Code Style',
  description: 'Use centralized enum for env variable names, not magic strings',
};

export function noMagicEnvStrings(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    MemberExpression(path) {
      const { node } = path;

      // Match process.env.XXX or process.env['XXX']
      if (
        !t.isMemberExpression(node.object) ||
        !t.isIdentifier(node.object.object, { name: 'process' }) ||
        !t.isIdentifier(node.object.property, { name: 'env' })
      ) {
        return;
      }

      // Check if the property access uses a string literal (computed['KEY'] or .KEY)
      if (node.computed && t.isStringLiteral(node.property)) {
        // process.env['SOME_STRING']
        const { loc } = node;
        results.push({
          rule: RULE_NAME,
          message: `Avoid magic env string '${node.property.value}'. Declare env variable names in a centralized enum.`,
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'warning',
        });
      } else if (!node.computed && t.isIdentifier(node.property)) {
        // process.env.SOME_VAR
        const { loc } = node;
        results.push({
          rule: RULE_NAME,
          message: `Avoid magic env string '${node.property.name}'. Declare env variable names in a centralized enum.`,
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'warning',
        });
      }
      // If it's process.env[someVariable] (dynamic access), that's fine - no flag
    },
  });

  return results;
}
