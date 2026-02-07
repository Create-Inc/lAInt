import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult } from '../types';

const RULE_NAME = 'transition-worklet-directive';

export function transitionWorkletDirective(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    ObjectProperty(path) {
      const { key, value, loc } = path.node;

      // Check if key is `screenStyleInterpolator`
      const keyName =
        key.type === 'Identifier' ? key.name : key.type === 'StringLiteral' ? key.value : null;

      if (keyName !== 'screenStyleInterpolator') return;

      // Check if value is an arrow function or function expression
      if (value.type !== 'ArrowFunctionExpression' && value.type !== 'FunctionExpression') return;

      const { body } = value;

      // Arrow functions with expression body (no block) can't have worklet directive
      if (body.type !== 'BlockStatement') {
        results.push({
          rule: RULE_NAME,
          message:
            'screenStyleInterpolator functions must include the "worklet" directive as the first statement',
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'error',
        });
        return;
      }

      // Check if directives contain "worklet" (Babel parses string
      // directives into the `directives` array, not the body statements)
      const hasWorklet = body.directives.some(
        (d) => d.type === 'Directive' && d.value.value === 'worklet',
      );

      if (!hasWorklet) {
        results.push({
          rule: RULE_NAME,
          message:
            'screenStyleInterpolator functions must include the "worklet" directive as the first statement',
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'error',
        });
      }
    },
  });

  return results;
}
