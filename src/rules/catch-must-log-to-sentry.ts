import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'catch-must-log-to-sentry';

export const meta = {
  name: 'catch-must-log-to-sentry',
  severity: 'warning' as const,
  platforms: null as Platform[] | null,
  category: 'Error Handling',
  description: 'Catch blocks with logger.error/console.error must also call Sentry',
};

/**
 * Recursively check if a node contains a call matching `object.method` pattern.
 */
function containsCall(node: t.Node, objectName: string, methodName: string): boolean {
  if (
    t.isCallExpression(node) &&
    t.isMemberExpression(node.callee) &&
    t.isIdentifier(node.callee.object, { name: objectName }) &&
    t.isIdentifier(node.callee.property, { name: methodName })
  ) {
    return true;
  }

  for (const key of t.VISITOR_KEYS[node.type] ?? []) {
    const child = (node as unknown as Record<string, unknown>)[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (t.isNode(item) && containsCall(item, objectName, methodName)) return true;
      }
    } else if (t.isNode(child) && containsCall(child, objectName, methodName)) {
      return true;
    }
  }

  return false;
}

function containsErrorLogging(node: t.Node): boolean {
  return containsCall(node, 'logger', 'error') || containsCall(node, 'console', 'error');
}

function containsSentryCapture(node: t.Node): boolean {
  return containsCall(node, 'Sentry', 'captureException');
}

export function catchMustLogToSentry(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    CatchClause(path) {
      const body = path.node.body;

      // Only flag if catch block has error logging but no Sentry
      if (containsErrorLogging(body) && !containsSentryCapture(body)) {
        const { loc } = path.node;
        results.push({
          rule: RULE_NAME,
          message:
            'Catch block logs an error but does not call Sentry.captureException(). Add Sentry reporting.',
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'warning',
        });
      }
    },
  });

  return results;
}
