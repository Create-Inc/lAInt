import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult } from '../types';

const RULE_NAME = 'tabs-screen-options-header-shown';

export function tabsScreenOptionsHeaderShown(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    JSXOpeningElement(path) {
      const { name, attributes, loc } = path.node;

      // Check for <Tabs component with screenOptions
      if (name.type !== 'JSXIdentifier' || name.name !== 'Tabs') {
        return;
      }

      // Look for screenOptions attribute
      for (const attr of attributes) {
        if (
          attr.type !== 'JSXAttribute' ||
          attr.name.type !== 'JSXIdentifier' ||
          attr.name.name !== 'screenOptions'
        ) {
          continue;
        }

        // Check if screenOptions has headerShown: false
        if (
          attr.value?.type === 'JSXExpressionContainer' &&
          attr.value.expression.type === 'ObjectExpression'
        ) {
          let hasHeaderShownFalse = false;

          for (const prop of attr.value.expression.properties) {
            if (
              prop.type === 'ObjectProperty' &&
              prop.key.type === 'Identifier' &&
              prop.key.name === 'headerShown' &&
              prop.value.type === 'BooleanLiteral' &&
              !prop.value.value
            ) {
              hasHeaderShownFalse = true;
              break;
            }
          }

          if (!hasHeaderShownFalse) {
            results.push({
              rule: RULE_NAME,
              message:
                'Tabs screenOptions should include headerShown: false for proper Expo Router navigation',
              line: loc?.start.line ?? 0,
              column: loc?.start.column ?? 0,
              severity: 'warning',
            });
          }
        }
      }
    },
  });

  return results;
}
