import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult } from '../types';

const RULE_NAME = 'textinput-keyboard-avoiding';

export function textInputKeyboardAvoiding(
  ast: File,
  _code: string
): LintResult[] {
  const results: LintResult[] = [];

  let hasTextInput = false;
  let hasKeyboardAvoidingView = false;
  let textInputLoc: { line: number; column: number } | null = null;

  traverse(ast, {
    ImportDeclaration(path) {
      const { source, specifiers } = path.node;

      // Check for KeyboardAvoidingAnimatedView or KeyboardAvoidingView import
      for (const spec of specifiers) {
        if (spec.type === 'ImportDefaultSpecifier' || spec.type === 'ImportSpecifier') {
          const name =
            spec.type === 'ImportDefaultSpecifier'
              ? spec.local.name
              : spec.imported.type === 'Identifier'
                ? spec.imported.name
                : '';

          if (
            name === 'KeyboardAvoidingAnimatedView' ||
            name === 'KeyboardAvoidingView'
          ) {
            hasKeyboardAvoidingView = true;
          }
        }
      }
    },

    JSXOpeningElement(path) {
      const { name, loc } = path.node;

      if (name.type === 'JSXIdentifier') {
        if (name.name === 'TextInput') {
          hasTextInput = true;
          if (!textInputLoc) {
            textInputLoc = {
              line: loc?.start.line ?? 0,
              column: loc?.start.column ?? 0,
            };
          }
        }

        if (
          name.name === 'KeyboardAvoidingAnimatedView' ||
          name.name === 'KeyboardAvoidingView'
        ) {
          hasKeyboardAvoidingView = true;
        }
      }
    },
  });

  // If there's a TextInput but no KeyboardAvoidingView, warn
  if (hasTextInput && !hasKeyboardAvoidingView && textInputLoc !== null) {
    const { line, column } = textInputLoc;
    results.push({
      rule: RULE_NAME,
      message:
        'Screens with TextInput should wrap content in KeyboardAvoidingAnimatedView or KeyboardAvoidingView for proper keyboard handling',
      line,
      column,
      severity: 'warning',
    });
  }

  return results;
}
