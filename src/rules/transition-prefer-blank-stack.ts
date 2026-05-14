import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'transition-prefer-blank-stack';

export const meta = {
  name: 'transition-prefer-blank-stack',
  severity: 'warning' as const,
  platforms: ['expo'] as Platform[] | null,
  category: 'Screen Transitions',
  description: 'Use Blank Stack instead of enableTransitions on Native Stack',
};

export function transitionPreferBlankStack(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    ObjectProperty(path) {
      const { key, value, loc } = path.node;

      const keyName =
        key.type === 'Identifier' ? key.name : key.type === 'StringLiteral' ? key.value : null;

      if (keyName !== 'enableTransitions') return;

      if (value.type === 'BooleanLiteral' && value.value) {
        results.push({
          rule: RULE_NAME,
          message:
            'Consider using Blank Stack from react-native-screen-transitions instead of enableTransitions on Native Stack. Blank Stack avoids delayed touch events and edge cases',
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'warning',
        });
      }
    },
  });

  return results;
}
