import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'no-sync-fs';

export const meta = {
  name: 'no-sync-fs',
  severity: 'error' as const,
  platforms: ['backend'] as Platform[] | null,
  category: 'Backend / SQL',
  description: 'Use fs.promises or fs/promises instead of sync fs methods',
};

function isSyncMethod(name: string): boolean {
  return name.endsWith('Sync');
}

function isFsSource(source: string): boolean {
  return source === 'fs' || source === 'node:fs';
}

function asyncAlternative(methodName: string): string {
  const name = methodName.replace(/Sync$/, '');
  return `fs.promises.${name}`;
}

export function noSyncFs(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  // Collect identifiers imported/required from 'fs' or 'node:fs'
  const fsImportedNames = new Set<string>();

  traverse(ast, {
    // import { readFileSync } from 'fs'
    ImportDeclaration(path) {
      if (!isFsSource(path.node.source.value)) return;

      for (const specifier of path.node.specifiers) {
        if (t.isImportSpecifier(specifier) && t.isIdentifier(specifier.local)) {
          const imported = t.isIdentifier(specifier.imported)
            ? specifier.imported.name
            : specifier.imported.value;
          if (isSyncMethod(imported)) {
            fsImportedNames.add(specifier.local.name);
          }
        }
        // import fs from 'fs' or import * as fs from 'fs'
        if (t.isImportDefaultSpecifier(specifier) || t.isImportNamespaceSpecifier(specifier)) {
          fsImportedNames.add(specifier.local.name);
        }
      }
    },

    CallExpression(path) {
      const { callee, loc } = path.node;

      // Pattern 1: fs.readFileSync(...)
      if (
        t.isMemberExpression(callee) &&
        t.isIdentifier(callee.property) &&
        isSyncMethod(callee.property.name)
      ) {
        const objectName = t.isIdentifier(callee.object) ? callee.object.name : null;

        // Only flag if the object is a known fs import or literally named 'fs'
        if (objectName === 'fs' || fsImportedNames.has(objectName ?? '')) {
          const method = callee.property.name;
          results.push({
            rule: RULE_NAME,
            message: `Use ${asyncAlternative(method)} or import from 'fs/promises' instead of ${method}`,
            line: loc?.start.line ?? 0,
            column: loc?.start.column ?? 0,
            severity: 'error',
          });
        }
      }

      // Pattern 2: readFileSync(...) — direct import from 'fs'
      if (t.isIdentifier(callee) && isSyncMethod(callee.name) && fsImportedNames.has(callee.name)) {
        const method = callee.name;
        results.push({
          rule: RULE_NAME,
          message: `Use ${asyncAlternative(method)} or import from 'fs/promises' instead of ${method}`,
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'error',
        });
      }
    },
  });

  return results;
}
