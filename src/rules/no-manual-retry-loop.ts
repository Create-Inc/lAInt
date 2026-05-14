import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'no-manual-retry-loop';

export const meta = {
  name: 'no-manual-retry-loop',
  severity: 'warning' as const,
  platforms: null as Platform[] | null,
  category: 'Code Style',
  description: 'Use a retry library instead of manual retry/polling loops',
};

export function noManualRetryLoop(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    'ForStatement|WhileStatement|DoWhileStatement'(loopPath) {
      let hasSetTimeout = false;

      loopPath.traverse({
        CallExpression(innerPath) {
          const callee = innerPath.node.callee;
          if (
            (callee.type === 'Identifier' && callee.name === 'setTimeout') ||
            (callee.type === 'MemberExpression' &&
              callee.property.type === 'Identifier' &&
              callee.property.name === 'setTimeout')
          ) {
            hasSetTimeout = true;
            innerPath.stop();
          }
        },
      });

      if (hasSetTimeout) {
        const { loc } = loopPath.node;
        results.push({
          rule: RULE_NAME,
          message:
            'Avoid manual retry/polling loops with setTimeout. Use a retry library (e.g. async-retry, p-retry) for better backoff, jitter, and error handling',
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'warning',
        });
      }
    },
  });

  return results;
}
