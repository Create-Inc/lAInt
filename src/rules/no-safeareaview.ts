import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult } from '../types';

const RULE_NAME = 'no-safeareaview';

export function noSafeAreaView(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    JSXOpeningElement(path) {
      const { name, loc } = path.node;

      if (name.type === 'JSXIdentifier' && name.name === 'SafeAreaView') {
        results.push({
          rule: RULE_NAME,
          message: 'Use useSafeAreaInsets() hook instead of SafeAreaView for better layout control',
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'warning',
        });
      }
    },
  });

  return results;
}
