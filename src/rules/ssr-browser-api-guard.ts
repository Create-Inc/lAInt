import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'ssr-browser-api-guard';

export const meta = {
  name: 'ssr-browser-api-guard',
  severity: 'error' as const,
  platforms: ['web'] as Platform[] | null,
  category: 'Next.js',
  description: 'Guard browser-only APIs in files that run during SSR',
};

const BROWSER_GLOBALS = [
  'window',
  'localStorage',
  'sessionStorage',
  'document',
  'navigator',
  'location',
  'history',
  'alert',
  'confirm',
  'prompt',
  'self',
];

export function ssrBrowserApiGuard(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  // Check if file has "use client" directive
  const hasUseClient = ast.program.directives?.some((d) => d.value.value === 'use client');

  // If the file has "use client", the existing browser-api-in-useeffect rule handles it.
  // This rule targets files WITHOUT "use client" that still reference browser APIs,
  // which will crash during SSR (server components, API routes, etc.)
  if (hasUseClient) return results;

  traverse(ast, {
    // Direct identifier usage: alert('hi'), confirm('sure?')
    CallExpression(path) {
      const { callee, loc } = path.node;
      if (callee.type !== 'Identifier') return;
      if (!['alert', 'confirm', 'prompt'].includes(callee.name)) return;

      if (isInSafeContext(path)) return;

      results.push({
        rule: RULE_NAME,
        message: `'${callee.name}()' is a browser-only API and will crash during SSR. Add a "use client" directive or guard with 'typeof window !== "undefined"'`,
        line: loc?.start.line ?? 0,
        column: loc?.start.column ?? 0,
        severity: 'error',
      });
    },

    MemberExpression(path) {
      const { object, loc } = path.node;

      if (object.type !== 'Identifier' || !BROWSER_GLOBALS.includes(object.name)) return;

      // Skip `typeof window` checks themselves
      if (path.parent.type === 'UnaryExpression' && path.parent.operator === 'typeof') {
        return;
      }

      if (isInSafeContext(path)) return;

      results.push({
        rule: RULE_NAME,
        message: `'${object.name}' is a browser-only global and will crash during SSR in a server component. Add a "use client" directive, wrap in useEffect, or guard with 'typeof ${object.name} !== "undefined"'`,
        line: loc?.start.line ?? 0,
        column: loc?.start.column ?? 0,
        severity: 'error',
      });
    },
  });

  return results;
}

function isInSafeContext(path: any): boolean {
  let currentPath = path.parentPath;

  while (currentPath) {
    const { type } = currentPath.node;

    // Inside useEffect callback — safe (client-only execution)
    if (
      type === 'CallExpression' &&
      currentPath.node.callee.type === 'Identifier' &&
      (currentPath.node.callee.name === 'useEffect' ||
        currentPath.node.callee.name === 'useLayoutEffect')
    ) {
      return true;
    }

    // Inside typeof check — safe
    if (type === 'IfStatement' || type === 'ConditionalExpression') {
      if (hasTypeofGuard(currentPath.node.test)) {
        return true;
      }
    }

    // Inside && short-circuit with typeof guard: typeof window !== 'undefined' && window.foo
    if (
      type === 'LogicalExpression' &&
      currentPath.node.operator === '&&' &&
      hasTypeofGuard(currentPath.node.left)
    ) {
      return true;
    }

    // Inside event handler (onClick, onSubmit, etc.) — safe (only runs on client)
    if (
      type === 'JSXAttribute' &&
      currentPath.node.name?.type === 'JSXIdentifier' &&
      currentPath.node.name.name.startsWith('on')
    ) {
      return true;
    }

    // Inside a function passed to addEventListener — safe
    if (
      type === 'CallExpression' &&
      currentPath.node.callee?.type === 'MemberExpression' &&
      currentPath.node.callee.property?.type === 'Identifier' &&
      currentPath.node.callee.property.name === 'addEventListener'
    ) {
      return true;
    }

    currentPath = currentPath.parentPath;
  }

  return false;
}

function hasTypeofGuard(node: any): boolean {
  if (!node) return false;

  // typeof window !== 'undefined'
  if (
    node.type === 'BinaryExpression' &&
    node.left?.type === 'UnaryExpression' &&
    node.left.operator === 'typeof' &&
    node.left.argument?.type === 'Identifier' &&
    BROWSER_GLOBALS.includes(node.left.argument.name)
  ) {
    return true;
  }

  // Recursive check for logical expressions
  if (node.type === 'LogicalExpression') {
    return hasTypeofGuard(node.left) || hasTypeofGuard(node.right);
  }

  return false;
}
