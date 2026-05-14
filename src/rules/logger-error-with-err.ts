import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'logger-error-with-err';

export const meta = {
  name: 'logger-error-with-err',
  severity: 'warning' as const,
  platforms: null as Platform[] | null,
  category: 'Code Style',
  description: 'logger.error() must include { err: Error } for stack traces',
};

export function loggerErrorWithErr(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    CallExpression(path) {
      const { callee, loc } = path.node;

      if (callee.type !== 'MemberExpression') return;

      const { object, property } = callee;

      // Only check calls to .error()
      if (property.type !== 'Identifier' || property.name !== 'error') return;

      // Determine the object name
      let objectName: string | null = null;
      if (object.type === 'Identifier') {
        objectName = object.name;
      }

      if (!objectName) return;

      // Skip console.error — different convention
      if (objectName === 'console') return;

      // Only check logger.error() and log.error()
      if (objectName !== 'logger' && objectName !== 'log') return;

      const args = path.node.arguments;

      // Check if the first argument is an ObjectExpression with an `err` property
      if (args.length === 0) {
        results.push({
          rule: RULE_NAME,
          message:
            'logger.error() should include an { err: <Error> } property in the first argument for proper stack traces in monitoring',
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'warning',
        });
        return;
      }

      const firstArg = args[0];

      if (firstArg.type !== 'ObjectExpression') {
        // First arg is not an object — flag it
        results.push({
          rule: RULE_NAME,
          message:
            'logger.error() should include an { err: <Error> } property in the first argument for proper stack traces in monitoring',
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'warning',
        });
        return;
      }

      // First arg is an object — check if it has an `err` key
      const hasErrProperty = firstArg.properties.some((prop) => {
        if (prop.type === 'ObjectProperty') {
          if (prop.key.type === 'Identifier' && prop.key.name === 'err') {
            return true;
          }
          if (prop.key.type === 'StringLiteral' && prop.key.value === 'err') {
            return true;
          }
        }
        return false;
      });

      if (!hasErrProperty) {
        results.push({
          rule: RULE_NAME,
          message:
            'logger.error() should include an { err: <Error> } property in the first argument for proper stack traces in monitoring',
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'warning',
        });
      }
    },
  });

  return results;
}
