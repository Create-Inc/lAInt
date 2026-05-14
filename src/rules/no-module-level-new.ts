import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'no-module-level-new';

export const meta = {
  name: 'no-module-level-new',
  severity: 'error' as const,
  platforms: ['web'] as Platform[] | null,
  category: 'Next.js',
  description: 'Avoid module-level constructors that execute during SSR',
};

const SAFE_CONSTRUCTORS = new Set([
  'Error',
  'TypeError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'URIError',
  'URL',
  'URLSearchParams',
  'RegExp',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'Date',
  'Promise',
  'Int8Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array',
  'BigInt64Array',
  'BigUint64Array',
  'ArrayBuffer',
  'SharedArrayBuffer',
  'DataView',
  'TextEncoder',
  'TextDecoder',
]);

export function noModuleLevelNew(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    NewExpression(path) {
      const { callee, loc } = path.node;

      let name: string;
      if (callee.type === 'Identifier') {
        name = callee.name;
      } else if (callee.type === 'MemberExpression' && callee.object.type === 'Identifier') {
        name = `${callee.object.name}.${
          callee.property.type === 'Identifier' ? callee.property.name : '...'
        }`;
      } else {
        name = 'Expression';
      }

      if (SAFE_CONSTRUCTORS.has(name)) {
        return;
      }

      let currentPath = path.parentPath;
      while (currentPath) {
        const { type } = currentPath.node;
        if (
          type === 'FunctionDeclaration' ||
          type === 'FunctionExpression' ||
          type === 'ArrowFunctionExpression' ||
          type === 'ClassDeclaration' ||
          type === 'ClassExpression' ||
          type === 'ClassMethod' ||
          type === 'ClassPrivateMethod' ||
          type === 'ObjectMethod'
        ) {
          return;
        }
        currentPath = currentPath.parentPath as typeof currentPath;
      }

      results.push({
        rule: RULE_NAME,
        message: `\`new ${name}()\` at module level will execute during SSR and may crash or cause side effects. Move it inside a component, useEffect, or wrap it in a factory function.`,
        line: loc?.start.line ?? 0,
        column: loc?.start.column ?? 0,
        severity: 'error',
      });
    },
  });

  return results;
}
