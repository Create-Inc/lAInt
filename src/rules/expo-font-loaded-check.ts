import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'expo-font-loaded-check';

export const meta = {
  name: 'expo-font-loaded-check',
  severity: 'error' as const,
  platforms: ['expo'] as Platform[] | null,
  category: 'React Native / Expo',
  description: 'useFonts() must check loaded before rendering',
};

export function expoFontLoadedCheck(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  let usesFontsCall: { line: number; column: number } | null = null;
  let hasLoadedCheck = false;
  let loadedVarName: string | null = null;

  traverse(ast, {
    VariableDeclarator(path) {
      const { id, init } = path.node;

      // Match: const [loaded, error] = useFonts(...) or const [fontsLoaded] = useFonts(...)
      if (
        init?.type === 'CallExpression' &&
        init.callee.type === 'Identifier' &&
        init.callee.name === 'useFonts' &&
        id.type === 'ArrayPattern' &&
        id.elements.length > 0 &&
        id.elements[0]?.type === 'Identifier'
      ) {
        loadedVarName = id.elements[0].name;
        usesFontsCall = {
          line: init.loc?.start.line ?? 0,
          column: init.loc?.start.column ?? 0,
        };
      }
    },

    // Check for loaded/error checks in if statements or conditionals
    IfStatement(path) {
      const { test } = path.node;

      // Check for `if (!loaded)` or `if (!loaded && !error)` patterns
      if (loadedVarName !== null && checkForLoadedReference(test, loadedVarName)) {
        hasLoadedCheck = true;
      }
    },

    ConditionalExpression(path) {
      const { test } = path.node;
      if (loadedVarName !== null && checkForLoadedReference(test, loadedVarName)) {
        hasLoadedCheck = true;
      }
    },

    LogicalExpression(path) {
      const { left, right } = path.node;
      if (
        loadedVarName !== null &&
        (checkForLoadedReference(left, loadedVarName) ||
          checkForLoadedReference(right, loadedVarName))
      ) {
        hasLoadedCheck = true;
      }
    },
  });

  if (usesFontsCall !== null && !hasLoadedCheck) {
    const { line, column } = usesFontsCall;
    results.push({
      rule: RULE_NAME,
      message:
        'useFonts() requires checking if fonts are loaded before rendering. Add: if (!loaded && !error) return null;',
      line,
      column,
      severity: 'error',
    });
  }

  return results;
}

function checkForLoadedReference(node: any, varName: string): boolean {
  if (!node) return false;

  // Direct identifier check
  if (node.type === 'Identifier' && node.name === varName) {
    return true;
  }

  // Unary expression: !loaded
  if (
    node.type === 'UnaryExpression' &&
    node.operator === '!' &&
    node.argument?.type === 'Identifier' &&
    node.argument.name === varName
  ) {
    return true;
  }

  // Check nested expressions
  if (node.type === 'LogicalExpression') {
    return (
      checkForLoadedReference(node.left, varName) || checkForLoadedReference(node.right, varName)
    );
  }

  return false;
}
