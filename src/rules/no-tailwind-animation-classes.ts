import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult } from '../types';

const RULE_NAME = 'no-tailwind-animation-classes';

// Tailwind animation class patterns
const ANIMATION_CLASS_PATTERN = /\banimate-\w+/;

export function noTailwindAnimationClasses(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    JSXAttribute(path) {
      const { name, value } = path.node;

      // Check className or class attribute
      if (name.type !== 'JSXIdentifier' || (name.name !== 'className' && name.name !== 'class')) {
        return;
      }

      // Check string literal value
      if (value?.type === 'StringLiteral') {
        if (ANIMATION_CLASS_PATTERN.test(value.value)) {
          results.push({
            rule: RULE_NAME,
            message:
              'Avoid Tailwind animation classes (animate-*). Use <style jsx global> tags to define animations instead.',
            line: value.loc?.start.line ?? 0,
            column: value.loc?.start.column ?? 0,
            severity: 'warning',
          });
        }
      }

      // Check template literal
      if (value?.type === 'JSXExpressionContainer' && value.expression.type === 'TemplateLiteral') {
        for (const quasi of value.expression.quasis) {
          if (ANIMATION_CLASS_PATTERN.test(quasi.value.raw)) {
            results.push({
              rule: RULE_NAME,
              message:
                'Avoid Tailwind animation classes (animate-*). Use <style jsx global> tags to define animations instead.',
              line: quasi.loc?.start.line ?? 0,
              column: quasi.loc?.start.column ?? 0,
              severity: 'warning',
            });
          }
        }
      }

      // Check string in expression container
      if (value?.type === 'JSXExpressionContainer' && value.expression.type === 'StringLiteral') {
        if (ANIMATION_CLASS_PATTERN.test(value.expression.value)) {
          results.push({
            rule: RULE_NAME,
            message:
              'Avoid Tailwind animation classes (animate-*). Use <style jsx global> tags to define animations instead.',
            line: value.expression.loc?.start.line ?? 0,
            column: value.expression.loc?.start.column ?? 0,
            severity: 'warning',
          });
        }
      }
    },
  });

  return results;
}
