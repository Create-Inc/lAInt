import traverse from '@babel/traverse';
import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import type {
  ArrowFunctionExpression,
  File,
  FunctionDeclaration,
  FunctionExpression,
} from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'prefer-named-params';

export const meta = {
  name: 'prefer-named-params',
  severity: 'warning' as const,
  platforms: null as Platform[] | null,
  category: 'Code Style',
  description: 'Use object destructuring instead of positional parameters',
};

type FunctionNode = ArrowFunctionExpression | FunctionDeclaration | FunctionExpression;

function checkFunction(path: NodePath<FunctionNode>, results: LintResult[]): void {
  const { params, loc } = path.node;

  // Only flag when there are 2+ params
  if (params.length < 2) return;

  // Skip if first param is already destructured (object pattern)
  if (t.isObjectPattern(params[0])) return;

  // Skip callbacks passed as arguments to any call
  if (t.isCallExpression(path.parent)) return;

  // Skip class methods and object methods
  if (t.isClassMethod(path.parent) || t.isObjectMethod(path.parent)) return;

  results.push({
    rule: RULE_NAME,
    message: 'Prefer named parameters using object destructuring instead of positional parameters',
    line: loc?.start.line ?? 0,
    column: loc?.start.column ?? 0,
    severity: 'warning',
  });
}

export function preferNamedParams(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    FunctionDeclaration(path) {
      checkFunction(path, results);
    },
    FunctionExpression(path) {
      checkFunction(path, results);
    },
    ArrowFunctionExpression(path) {
      checkFunction(path, results);
    },
  });

  return results;
}
