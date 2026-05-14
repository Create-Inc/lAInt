import traverse from '@babel/traverse';
import type {
  ArrowFunctionExpression,
  File,
  FunctionDeclaration,
  FunctionExpression,
  IfStatement,
  Statement,
} from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'prefer-guard-clauses';

export const meta = {
  name: 'prefer-guard-clauses',
  severity: 'warning' as const,
  platforms: null as Platform[] | null,
  category: 'Code Style',
  description: 'Use early returns instead of nesting if statements',
};

type FunctionNode = ArrowFunctionExpression | FunctionDeclaration | FunctionExpression;

function bodyStatements(node: FunctionNode): Statement[] | null {
  if (node.body.type === 'BlockStatement') {
    return node.body.body;
  }
  return null;
}

function checkFunctionBody(node: FunctionNode, results: LintResult[]): void {
  const statements = bodyStatements(node);
  if (!statements || statements.length === 0) return;

  // Case 1: Function body is a single if statement wrapping all logic
  if (statements.length === 1 && statements[0].type === 'IfStatement' && !statements[0].alternate) {
    const ifStmt = statements[0];
    results.push({
      rule: RULE_NAME,
      message:
        'Invert this condition and return early instead of wrapping the entire function body in an if statement',
      line: ifStmt.loc?.start.line ?? 0,
      column: ifStmt.loc?.start.column ?? 0,
      severity: 'warning',
    });
    return;
  }

  // Case 2: Nested if statements without else (arrow pattern)
  for (const stmt of statements) {
    if (stmt.type !== 'IfStatement') continue;
    checkNestedIfs(stmt, results);
  }
}

export function preferGuardClauses(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    FunctionDeclaration(path) {
      checkFunctionBody(path.node, results);
    },
    FunctionExpression(path) {
      checkFunctionBody(path.node, results);
    },
    ArrowFunctionExpression(path) {
      checkFunctionBody(path.node, results);
    },
  });

  return results;
}

function checkNestedIfs(node: IfStatement, results: LintResult[]): void {
  if (node.alternate) return;

  const consequent = node.consequent;
  const body: Statement[] = consequent.type === 'BlockStatement' ? consequent.body : [consequent];

  if (body.length === 1 && body[0].type === 'IfStatement' && !body[0].alternate) {
    results.push({
      rule: RULE_NAME,
      message: 'Use guard clauses (early returns) instead of nesting if statements',
      line: body[0].loc?.start.line ?? 0,
      column: body[0].loc?.start.column ?? 0,
      severity: 'warning',
    });
  }
}
