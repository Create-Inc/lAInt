import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'no-react-native-in-web';

export const meta = {
  name: 'no-react-native-in-web',
  severity: 'error' as const,
  platforms: ['web'] as Platform[] | null,
  category: 'Next.js',
  description: 'Do not import React Native modules from web code',
};

const REACT_NATIVE_MODULES = ['react-native', 'react-native-web'];

export function noReactNativeInWeb(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    ImportDeclaration(path) {
      const source = path.node.source.value;
      if (!REACT_NATIVE_MODULES.includes(source)) return;

      const { loc } = path.node;
      results.push({
        rule: RULE_NAME,
        message: `Do not import from '${source}' in web modules. Use platform-specific files (.native.tsx) or web-compatible alternatives`,
        line: loc?.start.line ?? 0,
        column: loc?.start.column ?? 0,
        severity: 'error',
      });
    },

    CallExpression(path) {
      const { callee, loc } = path.node;
      if (callee.type !== 'Identifier' || callee.name !== 'require') return;

      const arg = path.node.arguments[0];
      if (!arg || arg.type !== 'StringLiteral') return;
      if (!REACT_NATIVE_MODULES.includes(arg.value)) return;

      results.push({
        rule: RULE_NAME,
        message: `Do not require '${arg.value}' in web modules. Use platform-specific files (.native.tsx) or web-compatible alternatives`,
        line: loc?.start.line ?? 0,
        column: loc?.start.column ?? 0,
        severity: 'error',
      });
    },
  });

  return results;
}
