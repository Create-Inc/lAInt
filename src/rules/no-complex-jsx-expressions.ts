import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult } from '../types';

const RULE_NAME = 'no-complex-jsx-expressions';

export function noComplexJsxExpressions(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    JSXExpressionContainer(path) {
      const { expression, loc } = path.node;

      // Skip empty expressions
      if (expression.type === 'JSXEmptyExpression') {
        return;
      }

      // Skip simple expressions that are allowed
      if (isSimpleExpression(expression)) {
        return;
      }

      // Check for complex expressions
      if (isComplexExpression(expression)) {
        results.push({
          rule: RULE_NAME,
          message:
            'Avoid complex expressions in JSX. Extract to a variable for better readability.',
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'warning',
        });
      }
    },
  });

  return results;
}

function isSimpleExpression(node: any): boolean {
  // Simple identifiers are OK
  if (node.type === 'Identifier') return true;

  // Simple literals are OK
  if (
    node.type === 'StringLiteral' ||
    node.type === 'NumericLiteral' ||
    node.type === 'BooleanLiteral' ||
    node.type === 'NullLiteral'
  ) {
    return true;
  }

  // Template literals without complex expressions are OK
  if (node.type === 'TemplateLiteral') {
    return node.expressions.every(isSimpleExpression);
  }

  // Simple member expressions are OK (obj.prop, obj.prop.nested)
  if (node.type === 'MemberExpression') {
    return isSimpleMemberExpression(node);
  }

  // Simple function calls with simple args are OK (fn(), fn(x), fn(obj.prop))
  // But NOT IIFEs (immediately invoked function expressions)
  if (node.type === 'CallExpression') {
    // IIFEs are not simple
    if (
      node.callee.type === 'ArrowFunctionExpression' ||
      node.callee.type === 'FunctionExpression'
    ) {
      return false;
    }
    if (!isSimpleExpression(node.callee) && !isSimpleMemberExpression(node.callee)) {
      return false;
    }
    return node.arguments.length <= 2 && node.arguments.every(isSimpleExpression);
  }

  // Arrow functions for event handlers are OK
  if (node.type === 'ArrowFunctionExpression') {
    return true;
  }

  // Function expressions for event handlers are OK
  if (node.type === 'FunctionExpression') {
    return true;
  }

  return false;
}

function isSimpleMemberExpression(node: any): boolean {
  if (node.type !== 'MemberExpression') return false;

  // Check depth - allow up to 3 levels (obj.a.b)
  let depth = 0;
  let current = node;
  while (current.type === 'MemberExpression') {
    depth++;
    if (depth > 3) return false;
    current = current.object;
  }

  return current.type === 'Identifier' || current.type === 'ThisExpression';
}

function isComplexExpression(node: any): boolean {
  // Nested ternaries are complex
  if (node.type === 'ConditionalExpression') {
    if (
      node.consequent.type === 'ConditionalExpression' ||
      node.alternate.type === 'ConditionalExpression'
    ) {
      return true;
    }
    // Single ternary with complex branches
    if (!isSimpleExpression(node.consequent) || !isSimpleExpression(node.alternate)) {
      // Check if branches are just JSX elements (common pattern, allow it)
      if (node.consequent.type === 'JSXElement' || node.alternate.type === 'JSXElement') {
        return false;
      }
      if (node.consequent.type === 'NullLiteral' || node.alternate.type === 'NullLiteral') {
        return false;
      }
    }
    return false;
  }

  // Logical expressions with JSX are generally OK for conditional rendering
  if (node.type === 'LogicalExpression') {
    // Check for deeply nested logical expressions
    let depth = 0;
    let current = node;
    while (current.type === 'LogicalExpression') {
      depth++;
      if (depth > 2) return true; // a && b && c && d is too complex
      current = current.left;
    }
    return false;
  }

  // Long call chains are complex
  if (node.type === 'CallExpression') {
    let chainLength = 0;
    let current = node;
    while (current.type === 'CallExpression') {
      chainLength++;
      if (chainLength > 3) return true;
      if (current.callee.type === 'MemberExpression') {
        current = current.callee.object;
      } else {
        break;
      }
    }
  }

  // IIFE is complex
  if (
    node.type === 'CallExpression' &&
    (node.callee.type === 'ArrowFunctionExpression' || node.callee.type === 'FunctionExpression')
  ) {
    return true;
  }

  return false;
}
