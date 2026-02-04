import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult } from '../types';

const RULE_NAME = 'glass-interactive-prop';

const PRESSABLE_COMPONENTS = [
  'TouchableOpacity',
  'TouchableHighlight',
  'TouchableWithoutFeedback',
  'Pressable',
  'TouchableNativeFeedback',
];

export function glassInteractiveProp(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    JSXElement(path) {
      const { openingElement } = path.node;
      const { name, loc } = openingElement;

      // Check if this is a Pressable-type component
      if (
        name.type !== 'JSXIdentifier' ||
        !PRESSABLE_COMPONENTS.includes(name.name)
      ) {
        return;
      }

      // Check if it contains a GlassView child
      let hasGlassViewChild = false;
      let glassViewHasInteractive = false;

      path.traverse({
        JSXOpeningElement(childPath) {
          const childName = childPath.node.name;
          if (childName.type === 'JSXIdentifier' && childName.name === 'GlassView') {
            hasGlassViewChild = true;

            // Check if GlassView has isInteractive prop
            for (const attr of childPath.node.attributes) {
              if (
                attr.type === 'JSXAttribute' &&
                attr.name.type === 'JSXIdentifier' &&
                attr.name.name === 'isInteractive'
              ) {
                // Check if it's set to true
                const attrValue = attr.value;
                if (attrValue == null) {
                  // isInteractive (no value = true)
                  glassViewHasInteractive = true;
                } else if (attrValue.type === 'JSXExpressionContainer') {
                  const expr = attrValue.expression;
                  if (expr.type === 'BooleanLiteral' && expr.value === true) {
                    glassViewHasInteractive = true;
                  }
                }
              }
            }
          }
        },
      });

      if (hasGlassViewChild && !glassViewHasInteractive) {
        results.push({
          rule: RULE_NAME,
          message: `GlassView inside ${name.name} should have isInteractive={true} for fluid press effects`,
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'warning',
        });
      }
    },
  });

  return results;
}
