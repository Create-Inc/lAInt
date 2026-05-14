import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'no-nested-try-catch';

export const meta = {
  name: 'no-nested-try-catch',
  severity: 'warning' as const,
  platforms: null as Platform[] | null,
  category: 'Code Style',
  description: 'Avoid nested try-catch blocks, extract to separate functions',
};

export function noNestedTryCatch(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    TryStatement(path) {
      // Check if any ancestor is a TryStatement
      let parent = path.parentPath;
      while (parent) {
        if (parent.isTryStatement()) {
          const { loc } = path.node;
          results.push({
            rule: RULE_NAME,
            message:
              'Avoid nested try-catch blocks. Extract inner try-catch to a separate function.',
            line: loc?.start.line ?? 0,
            column: loc?.start.column ?? 0,
            severity: 'warning',
          });
          break;
        }
        parent = parent.parentPath as typeof parent;
      }
    },
  });

  return results;
}
