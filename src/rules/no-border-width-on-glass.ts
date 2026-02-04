import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult } from '../types';

const RULE_NAME = 'no-border-width-on-glass';

export function noBorderWidthOnGlass(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    JSXOpeningElement(path) {
      const { name, attributes } = path.node;

      // Check for GlassView component
      if (name.type === 'JSXIdentifier' && name.name === 'GlassView') {
        for (const attr of attributes) {
          if (
            attr.type === 'JSXAttribute' &&
            attr.name.type === 'JSXIdentifier' &&
            attr.name.name === 'style' &&
            attr.value?.type === 'JSXExpressionContainer'
          ) {
            const expr = attr.value.expression;

            // Handle style={{ ... }}
            if (expr.type === 'ObjectExpression') {
              checkStyleForBorderWidth(expr.properties, results);
            }

            // Handle style={[...]} (array of styles)
            if (expr.type === 'ArrayExpression') {
              for (const element of expr.elements) {
                if (element?.type === 'ObjectExpression') {
                  checkStyleForBorderWidth(element.properties, results);
                }
              }
            }
          }
        }
      }
    },
  });

  return results;
}

function checkStyleForBorderWidth(properties: any[], results: LintResult[]): void {
  for (const prop of properties) {
    if (prop.type !== 'ObjectProperty') continue;

    if (
      prop.key.type === 'Identifier' &&
      (prop.key.name === 'borderWidth' ||
        prop.key.name === 'borderTopWidth' ||
        prop.key.name === 'borderBottomWidth' ||
        prop.key.name === 'borderLeftWidth' ||
        prop.key.name === 'borderRightWidth')
    ) {
      results.push({
        rule: RULE_NAME,
        message:
          'Never set borderWidth on GlassView components - it causes the component to ignore borderRadius',
        line: prop.loc?.start.line ?? 0,
        column: prop.loc?.start.column ?? 0,
        severity: 'error',
      });
    }
  }
}
