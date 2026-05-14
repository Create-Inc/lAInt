import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'no-server-import-in-client';

export const meta = {
  name: 'no-server-import-in-client',
  severity: 'error' as const,
  platforms: ['web'] as Platform[] | null,
  category: 'Next.js',
  description: '"use client" files must not import server-only modules',
};

const SERVER_ONLY_MODULES = ['server-only', 'next/headers'];

function isServerOnlyModule(source: string): boolean {
  return SERVER_ONLY_MODULES.some((mod) => source === mod);
}

export function noServerImportInClient(ast: File, _code: string): LintResult[] {
  const hasUseClient = ast.program.directives.some((d) => d.value.value === 'use client');

  if (!hasUseClient) {
    return [];
  }

  const results: LintResult[] = [];

  traverse(ast, {
    ImportDeclaration(path) {
      // Skip type-only imports (erased at compile time)
      if (path.node.importKind === 'type') return;

      const source = path.node.source.value;
      const { loc } = path.node;

      if (isServerOnlyModule(source)) {
        results.push({
          rule: RULE_NAME,
          message: `'${source}' is a server-only module and cannot be imported in a "use client" file.`,
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'error',
        });
      }
    },

    ExportNamedDeclaration(path) {
      const { source, loc } = path.node;
      if (!source) return;

      if (path.node.exportKind === 'type') return;

      if (isServerOnlyModule(source.value)) {
        results.push({
          rule: RULE_NAME,
          message: `'${source.value}' is a server-only module and cannot be re-exported from a "use client" file.`,
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'error',
        });
      }
    },

    ExportAllDeclaration(path) {
      const source = path.node.source.value;
      const { loc } = path.node;

      if (path.node.exportKind === 'type') return;

      if (isServerOnlyModule(source)) {
        results.push({
          rule: RULE_NAME,
          message: `'${source}' is a server-only module and cannot be re-exported from a "use client" file.`,
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'error',
        });
      }
    },
  });

  return results;
}
