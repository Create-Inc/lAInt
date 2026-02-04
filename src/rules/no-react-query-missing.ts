import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult } from '../types';

const RULE_NAME = 'no-react-query-missing';

export function noReactQueryMissing(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  let hasFetchCall: { line: number; column: number } | null = null;
  let hasReactQueryImport = false;
  let hasUseEffectWithFetch = false;

  traverse(ast, {
    ImportDeclaration(path) {
      const { source } = path.node;
      if (
        source.value === '@tanstack/react-query' ||
        source.value === 'react-query'
      ) {
        hasReactQueryImport = true;
      }
    },

    CallExpression(path) {
      const { callee, loc } = path.node;

      // Check for fetch() calls
      if (callee.type === 'Identifier' && callee.name === 'fetch') {
        if (!hasFetchCall) {
          hasFetchCall = {
            line: loc?.start.line ?? 0,
            column: loc?.start.column ?? 0,
          };
        }

        // Check if inside useEffect
        let parent: typeof path.parentPath = path.parentPath;
        while (parent) {
          if (
            parent.node.type === 'CallExpression' &&
            parent.node.callee.type === 'Identifier' &&
            parent.node.callee.name === 'useEffect'
          ) {
            hasUseEffectWithFetch = true;
            break;
          }
          parent = parent.parentPath as typeof parent;
        }
      }
    },
  });

  // If there's a fetch call in useEffect without react-query, suggest using it
  if (hasUseEffectWithFetch && !hasReactQueryImport && hasFetchCall !== null) {
    const { line, column } = hasFetchCall;
    results.push({
      rule: RULE_NAME,
      message:
        "Use @tanstack/react-query for data fetching instead of fetch() in useEffect. It provides caching, loading states, and error handling.",
      line,
      column,
      severity: 'warning',
    });
  }

  return results;
}
