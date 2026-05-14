import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'safe-json-parse';

export const meta = {
  name: 'safe-json-parse',
  severity: 'warning' as const,
  platforms: null as Platform[] | null,
  category: 'Code Style',
  description: 'Wrap JSON.parse in try-catch to handle malformed input',
};

export function safeJsonParse(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    CallExpression(path) {
      const { callee, loc } = path.node;

      // Check for JSON.parse() calls
      if (
        callee.type !== 'MemberExpression' ||
        callee.object.type !== 'Identifier' ||
        callee.object.name !== 'JSON' ||
        callee.property.type !== 'Identifier' ||
        callee.property.name !== 'parse'
      ) {
        return;
      }

      // Walk up ancestors to check if inside a TryStatement
      let isInTryCatch = false;
      let currentPath: typeof path.parentPath = path.parentPath;

      while (currentPath) {
        if (currentPath.node.type === 'TryStatement') {
          isInTryCatch = true;
          break;
        }
        currentPath = currentPath.parentPath as typeof currentPath;
      }

      if (!isInTryCatch) {
        results.push({
          rule: RULE_NAME,
          message: 'Wrap JSON.parse() in a try-catch block to handle malformed input.',
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'warning',
        });
      }
    },
  });

  return results;
}
