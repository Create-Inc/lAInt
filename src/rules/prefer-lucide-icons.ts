import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult } from '../types';

const RULE_NAME = 'prefer-lucide-icons';

// Common icon libraries that should be replaced with lucide
const DISCOURAGED_ICON_PACKAGES = [
  '@expo/vector-icons',
  'react-native-vector-icons',
  '@react-native-vector-icons/fontawesome',
  '@react-native-vector-icons/material-icons',
  'react-icons',
];

export function preferLucideIcons(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    ImportDeclaration(path) {
      const { source, loc } = path.node;
      const packageName = source.value;

      // Check if importing from discouraged icon packages
      if (
        DISCOURAGED_ICON_PACKAGES.some(
          (pkg) => packageName === pkg || packageName.startsWith(pkg + '/')
        )
      ) {
        results.push({
          rule: RULE_NAME,
          message: `Prefer 'lucide-react' (web) or 'lucide-react-native' (mobile) over '${packageName}'`,
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'warning',
        });
      }
    },
  });

  return results;
}
