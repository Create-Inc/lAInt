import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult } from '../types';

const RULE_NAME = 'expo-image-import';

export function expoImageImport(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    ImportDeclaration(path) {
      const { source, specifiers, loc } = path.node;

      // Check for imports from 'react-native'
      if (source.value === 'react-native') {
        for (const specifier of specifiers) {
          if (
            specifier.type === 'ImportSpecifier' &&
            specifier.imported.type === 'Identifier' &&
            specifier.imported.name === 'Image'
          ) {
            results.push({
              rule: RULE_NAME,
              message:
                "Import Image from 'expo-image' instead of 'react-native' for Expo apps",
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
