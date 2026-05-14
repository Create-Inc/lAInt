import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'require-use-client';

export const meta = {
  name: 'require-use-client',
  severity: 'error' as const,
  platforms: ['web'] as Platform[] | null,
  category: 'Next.js',
  description: 'Files using client-only features must have "use client" directive',
};

export function requireUseClient(ast: File, _code: string): LintResult[] {
  const hasDirective = ast.program.directives.some(
    (d) => d.value.value === 'use client' || d.value.value === 'use server',
  );

  if (hasDirective) {
    return [];
  }

  const results: LintResult[] = [];

  traverse(ast, {
    CallExpression(path) {
      const { callee, loc } = path.node;

      // React hooks: useState(), useEffect(), useRef(), etc.
      if (callee.type === 'Identifier' && /^use[A-Z]/.test(callee.name)) {
        results.push({
          rule: RULE_NAME,
          message: `'${callee.name}()' is a client-only hook. Add "use client" at the top of this file.`,
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'error',
        });
      }

      // createContext()
      if (callee.type === 'Identifier' && callee.name === 'createContext') {
        results.push({
          rule: RULE_NAME,
          message: `'createContext()' is client-only. Add "use client" at the top of this file.`,
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'error',
        });
      }

      // React.createContext()
      if (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'React' &&
        callee.property.type === 'Identifier' &&
        callee.property.name === 'createContext'
      ) {
        results.push({
          rule: RULE_NAME,
          message: `'React.createContext()' is client-only. Add "use client" at the top of this file.`,
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'error',
        });
      }
    },

    JSXAttribute(path) {
      const { name, loc } = path.node;

      // Event handler props: onClick, onChange, onSubmit, etc.
      if (name.type === 'JSXIdentifier' && /^on[A-Z]/.test(name.name)) {
        results.push({
          rule: RULE_NAME,
          message: `'${name.name}' is a client-only event handler. Add "use client" at the top of this file.`,
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'error',
        });
      }
    },
  });

  return results;
}
