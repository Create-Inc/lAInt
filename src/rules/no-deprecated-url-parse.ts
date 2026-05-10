import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { File } from '@babel/types';
import type { LintResult } from '../types';

const RULE_NAME = 'no-deprecated-url-parse';

export function noDeprecatedUrlParse(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  // Track identifiers imported/required from 'url' or 'node:url'
  const urlImportedNames = new Set<string>();

  traverse(ast, {
    ImportDeclaration(path) {
      const source = path.node.source.value;
      if (source !== 'url' && source !== 'node:url') return;

      for (const specifier of path.node.specifiers) {
        if (t.isImportSpecifier(specifier) && t.isIdentifier(specifier.local)) {
          const imported = t.isIdentifier(specifier.imported)
            ? specifier.imported.name
            : specifier.imported.value;
          if (imported === 'parse') {
            urlImportedNames.add(specifier.local.name);
          }
        }
        if (t.isImportDefaultSpecifier(specifier) || t.isImportNamespaceSpecifier(specifier)) {
          urlImportedNames.add(specifier.local.name);
        }
      }
    },

    CallExpression(path) {
      const { callee, loc } = path.node;

      // Pattern 1: url.parse(...)
      if (
        t.isMemberExpression(callee) &&
        t.isIdentifier(callee.property) &&
        callee.property.name === 'parse'
      ) {
        const objectName = t.isIdentifier(callee.object) ? callee.object.name : null;
        // Note: only the lowercase legacy `url` module is deprecated. `URL.parse`
        // is the modern static method on the WHATWG URL constructor (Node 22+,
        // browsers) and is a valid replacement — do not flag it.
        if (objectName === 'url' || urlImportedNames.has(objectName ?? '')) {
          results.push({
            rule: RULE_NAME,
            message: "url.parse() is deprecated. Use 'new URL(input, base)' instead",
            line: loc?.start.line ?? 0,
            column: loc?.start.column ?? 0,
            severity: 'warning',
          });
        }
      }

      // Pattern 2: parse(...) — direct named import from 'url'
      if (t.isIdentifier(callee) && urlImportedNames.has(callee.name)) {
        results.push({
          rule: RULE_NAME,
          message: "url.parse() is deprecated. Use 'new URL(input, base)' instead",
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'warning',
        });
      }
    },
  });

  return results;
}
