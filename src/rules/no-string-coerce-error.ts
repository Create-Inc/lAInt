import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'no-string-coerce-error';

export const meta = {
  name: 'no-string-coerce-error',
  severity: 'warning' as const,
  platforms: null as Platform[] | null,
  category: 'Code Style',
  description: 'Use JSON.stringify instead of String() for unknown caught errors',
};

/**
 * Check if an expression contains a `String(name)` call where `name` matches the given identifier.
 */
function containsStringCall(node: t.Node, name: string): t.CallExpression | null {
  if (
    t.isCallExpression(node) &&
    t.isIdentifier(node.callee, { name: 'String' }) &&
    node.arguments.length === 1 &&
    t.isIdentifier(node.arguments[0], { name })
  ) {
    return node;
  }

  // Check children for nested String() calls (e.g. `new Error(String(err))`)
  for (const key of t.VISITOR_KEYS[node.type] ?? []) {
    const child = (node as unknown as Record<string, unknown>)[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (t.isNode(item)) {
          const found = containsStringCall(item, name);
          if (found) return found;
        }
      }
    } else if (t.isNode(child)) {
      const found = containsStringCall(child, name);
      if (found) return found;
    }
  }

  return null;
}

export function noStringCoerceError(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    ConditionalExpression(path) {
      const { test, alternate } = path.node;

      // Match: <ident> instanceof Error
      if (
        !t.isBinaryExpression(test, { operator: 'instanceof' }) ||
        !t.isIdentifier(test.left) ||
        !t.isIdentifier(test.right, { name: 'Error' })
      ) {
        return;
      }

      const errorName = test.left.name;
      const stringCall = containsStringCall(alternate, errorName);

      if (stringCall) {
        results.push({
          rule: RULE_NAME,
          message: `String(${errorName}) may produce '[object Object]' for non-Error objects. Consider JSON.stringify(${errorName}) to preserve structure.`,
          line: stringCall.loc?.start.line ?? path.node.loc?.start.line ?? 0,
          column: stringCall.loc?.start.column ?? path.node.loc?.start.column ?? 0,
          severity: 'warning',
        });
      }
    },
  });

  return results;
}
