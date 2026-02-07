import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult } from '../types';

const RULE_NAME = 'fetch-response-ok-check';

export function fetchResponseOkCheck(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  // Track fetch calls and whether they have .ok checks
  const fetchCalls: Map<string, { line: number; column: number; hasOkCheck: boolean }> = new Map();

  traverse(ast, {
    // Find fetch() calls
    CallExpression(path) {
      const { callee, loc } = path.node;

      if (callee.type === 'Identifier' && callee.name === 'fetch') {
        // Generate a unique key based on location
        const key = `${String(loc?.start.line)}:${String(loc?.start.column)}`;
        fetchCalls.set(key, {
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          hasOkCheck: false,
        });
      }
    },

    // Look for response.ok checks
    MemberExpression(path) {
      const { object, property } = path.node;

      // Check for .ok access
      if (
        property.type === 'Identifier' &&
        property.name === 'ok' &&
        object.type === 'Identifier'
      ) {
        // Mark that we found an .ok check (heuristic - we assume it's for a fetch response)
        // This is a simplified check - in a real linter we'd track variable assignments
        fetchCalls.forEach((value) => {
          value.hasOkCheck = true;
        });
      }
    },
  });

  // Report fetch calls without .ok checks
  // Note: This is a simplified heuristic. A more sophisticated implementation
  // would track the actual response variable through assignments.
  // For now, if there's ANY .ok check in the file, we assume fetches are handled.
  const hasAnyOkCheck = Array.from(fetchCalls.values()).some((v) => v.hasOkCheck);

  if (!hasAnyOkCheck && fetchCalls.size > 0) {
    // Only report the first fetch call to avoid noise
    const firstFetch = Array.from(fetchCalls.values())[0];
    results.push({
      rule: RULE_NAME,
      message:
        'When using fetch(), check response.ok and handle errors. Example: if (!response.ok) throw new Error(`HTTP ${response.status}`)',
      line: firstFetch.line,
      column: firstFetch.column,
      severity: 'warning',
    });
  }

  return results;
}
