import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult } from '../types';

const RULE_NAME = 'transition-shared-tag-mismatch';

interface TagInfo {
  tag: string;
  line: number;
  column: number;
}

function getTransitionComponent(
  name: any
): 'Pressable' | 'View' | null {
  if (
    name.type === 'JSXMemberExpression' &&
    name.object.type === 'JSXIdentifier' &&
    name.object.name === 'Transition'
  ) {
    if (name.property.name === 'Pressable') return 'Pressable';
    if (name.property.name === 'View') return 'View';
  }
  return null;
}

export function transitionSharedTagMismatch(
  ast: File,
  _code: string
): LintResult[] {
  const results: LintResult[] = [];

  const pressableTags: TagInfo[] = [];
  const viewTags: TagInfo[] = [];

  traverse(ast, {
    JSXOpeningElement(path) {
      const { name, attributes, loc } = path.node;

      const component = getTransitionComponent(name);
      if (!component) return;

      // Find sharedBoundTag attribute
      for (const attr of attributes) {
        if (
          attr.type === 'JSXAttribute' &&
          attr.name.type === 'JSXIdentifier' &&
          attr.name.name === 'sharedBoundTag'
        ) {
          let tagValue: string | null = null;

          if (attr.value?.type === 'StringLiteral') {
            tagValue = attr.value.value;
          } else if (
            attr.value?.type === 'JSXExpressionContainer' &&
            attr.value.expression.type === 'StringLiteral'
          ) {
            tagValue = attr.value.expression.value;
          }

          if (tagValue) {
            const info: TagInfo = {
              tag: tagValue,
              line: loc?.start.line ?? 0,
              column: loc?.start.column ?? 0,
            };

            if (component === 'Pressable') {
              pressableTags.push(info);
            } else {
              viewTags.push(info);
            }
          }
        }
      }
    },
  });

  const pressableTagSet = new Set(pressableTags.map((t) => t.tag));
  const viewTagSet = new Set(viewTags.map((t) => t.tag));

  // Check for Pressable tags without matching View
  for (const info of pressableTags) {
    if (!viewTagSet.has(info.tag)) {
      results.push({
        rule: RULE_NAME,
        message: `sharedBoundTag "${info.tag}" on Transition.Pressable has no matching Transition.View with the same tag`,
        line: info.line,
        column: info.column,
        severity: 'warning',
      });
    }
  }

  // Check for View tags without matching Pressable
  for (const info of viewTags) {
    if (!pressableTagSet.has(info.tag)) {
      results.push({
        rule: RULE_NAME,
        message: `sharedBoundTag "${info.tag}" on Transition.View has no matching Transition.Pressable with the same tag`,
        line: info.line,
        column: info.column,
        severity: 'warning',
      });
    }
  }

  return results;
}
