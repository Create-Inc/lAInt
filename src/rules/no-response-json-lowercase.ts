import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult } from '../types';

const RULE_NAME = 'no-response-json-lowercase';

export function noResponseJsonLowercase(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    NewExpression(path) {
      const { callee, loc } = path.node;

      // Check for new Response(JSON.stringify(...))
      if (callee.type === 'Identifier' && callee.name === 'Response') {
        const args = path.node.arguments;
        if (
          args.length > 0 &&
          args[0].type === 'CallExpression' &&
          args[0].callee.type === 'MemberExpression' &&
          args[0].callee.object.type === 'Identifier' &&
          args[0].callee.object.name === 'JSON' &&
          args[0].callee.property.type === 'Identifier' &&
          args[0].callee.property.name === 'stringify'
        ) {
          results.push({
            rule: RULE_NAME,
            message:
              'Use Response.json() instead of new Response(JSON.stringify()). Example: return Response.json({ data })',
            line: loc?.start.line ?? 0,
            column: loc?.start.column ?? 0,
            severity: 'warning',
          });
        }
      }
    },
  });

  return results;
}
