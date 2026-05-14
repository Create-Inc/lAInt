import traverse from '@babel/traverse';
import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import type {
  AssignmentExpression,
  AwaitExpression,
  BreakStatement,
  CallExpression,
  File,
  ForOfStatement,
  ReturnStatement,
  UpdateExpression,
} from '@babel/types';
import type { LintResult } from '../types';

const RULE_NAME = 'prefer-promise-all';

export const meta = {
  name: 'prefer-promise-all',
  severity: 'warning' as const,
  platforms: null,
  category: 'Code Style',
  description: 'Prefer Promise.all for independent async work in loops',
};

export function preferPromiseAll(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    ForOfStatement(loopPath: NodePath<ForOfStatement>) {
      // Skip `for await...of` — already an async iterator pattern
      if (loopPath.node.await) return;

      let hasAwait = false;
      let hasOrderDependentPattern = false;

      loopPath.traverse({
        // Don't descend into nested functions — their awaits are independent
        'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression'(innerPath: NodePath) {
          innerPath.skip();
        },

        // Don't descend into nested loops
        'ForStatement|ForOfStatement|ForInStatement|WhileStatement|DoWhileStatement'(
          innerPath: NodePath,
        ) {
          innerPath.skip();
        },

        AwaitExpression(_awaitPath: NodePath<AwaitExpression>) {
          hasAwait = true;
        },

        CallExpression(callPath: NodePath<CallExpression>) {
          const { callee } = callPath.node;

          // Detect .push() calls — order-dependent array accumulation
          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.property) &&
            callee.property.name === 'push'
          ) {
            hasOrderDependentPattern = true;
            callPath.stop();
          }

          // Detect .splice() / .unshift() — order-dependent
          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.property) &&
            (callee.property.name === 'splice' || callee.property.name === 'unshift')
          ) {
            hasOrderDependentPattern = true;
            callPath.stop();
          }
        },

        // Detect break/return conditioned on await result — sequential early-exit
        BreakStatement(breakPath: NodePath<BreakStatement>) {
          // Check this break targets the outer for...of (not a nested switch/loop)
          let parent: NodePath | null = breakPath.parentPath;
          while (parent && parent !== loopPath) {
            const type = parent.node.type;
            if (
              type === 'ForStatement' ||
              type === 'WhileStatement' ||
              type === 'DoWhileStatement' ||
              type === 'ForOfStatement' ||
              type === 'ForInStatement' ||
              type === 'SwitchStatement'
            ) {
              return; // break belongs to nested construct
            }
            parent = parent.parentPath;
          }
          hasOrderDependentPattern = true;
        },

        ReturnStatement(returnPath: NodePath<ReturnStatement>) {
          // Check this return is in the function containing the loop, not a nested fn
          let parent: NodePath | null = returnPath.parentPath;
          while (parent && parent !== loopPath) {
            if (
              parent.node.type === 'FunctionDeclaration' ||
              parent.node.type === 'FunctionExpression' ||
              parent.node.type === 'ArrowFunctionExpression'
            ) {
              return; // return belongs to nested function
            }
            parent = parent.parentPath;
          }
          hasOrderDependentPattern = true;
        },
      });

      if (hasOrderDependentPattern) return;

      // Check for cross-iteration data dependencies:
      // A variable declared BEFORE the loop that is both read and written inside the loop body
      if (hasCrossIterationDependency(loopPath)) return;

      if (hasAwait) {
        const { loc } = loopPath.node;
        results.push({
          rule: RULE_NAME,
          message:
            'Sequential await in for...of loop can likely be parallelized with Promise.all(items.map(async (item) => ...)) for better performance',
          line: loc?.start.line ?? 0,
          column: loc?.start.column ?? 0,
          severity: 'warning',
        });
      }
    },
  });

  return results;
}

function hasCrossIterationDependency(loopPath: NodePath<ForOfStatement>): boolean {
  // Collect identifiers that are ASSIGNED inside the loop body
  const assignedInLoop = new Set<string>();

  loopPath.traverse({
    'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression'(innerPath: NodePath) {
      innerPath.skip();
    },

    AssignmentExpression(assignPath: NodePath<AssignmentExpression>) {
      collectAssignedNames(assignPath.node.left, assignedInLoop);
    },

    UpdateExpression(updatePath: NodePath<UpdateExpression>) {
      const arg = updatePath.node.argument;
      if (t.isIdentifier(arg)) {
        assignedInLoop.add(arg.name);
      } else if (t.isMemberExpression(arg)) {
        const root = getMemberRootName(arg);
        if (root) assignedInLoop.add(root);
      }
    },
  });

  if (assignedInLoop.size === 0) return false;

  // Check if any of those assigned variables are bound OUTSIDE the loop
  for (const name of assignedInLoop) {
    const binding = loopPath.scope.getBinding(name);
    if (!binding) continue; // global or unresolved — assume no dependency

    // If the variable is declared outside the loop, it's a cross-iteration dependency
    const declPath = binding.path;
    if (!isInsidePath(declPath, loopPath)) {
      return true;
    }
  }

  return false;
}

// Walk a left-hand side and collect every identifier name it ultimately writes
// to. Handles Identifier, MemberExpression (root object), ObjectPattern,
// ArrayPattern, RestElement, AssignmentPattern (default-value destructure),
// and TS-only wrappers like `as` / `!` casts.
function collectAssignedNames(node: t.Node, out: Set<string>): void {
  if (t.isIdentifier(node)) {
    out.add(node.name);
    return;
  }

  if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
    // For `state.prev = ...` or `obj.a.b = ...`, treat the root identifier
    // (e.g. `state`, `obj`) as the dependency surface. If that root is bound
    // outside the loop, mutations to it carry across iterations.
    const root = getMemberRootName(node);
    if (root) out.add(root);
    return;
  }

  if (t.isObjectPattern(node)) {
    for (const prop of node.properties) {
      if (t.isObjectProperty(prop)) {
        // value is the binding target (e.g. `{ a: x }` → `x`; `{ a }` → `a`)
        collectAssignedNames(prop.value, out);
      } else if (t.isRestElement(prop)) {
        collectAssignedNames(prop.argument, out);
      }
    }
    return;
  }

  if (t.isArrayPattern(node)) {
    for (const el of node.elements) {
      if (el === null) continue;
      collectAssignedNames(el, out);
    }
    return;
  }

  if (t.isRestElement(node)) {
    collectAssignedNames(node.argument, out);
    return;
  }

  if (t.isAssignmentPattern(node)) {
    collectAssignedNames(node.left, out);
    return;
  }

  if (t.isTSNonNullExpression(node) || t.isTSAsExpression(node)) {
    collectAssignedNames(node.expression, out);
    return;
  }
}

function getMemberRootName(node: t.MemberExpression | t.OptionalMemberExpression): string | null {
  let current: t.Expression | t.Super = node.object;
  while (t.isMemberExpression(current) || t.isOptionalMemberExpression(current)) {
    current = current.object;
  }
  if (t.isIdentifier(current)) return current.name;
  if (t.isThisExpression(current)) return 'this';
  return null;
}

function isInsidePath(inner: NodePath, outer: NodePath): boolean {
  let current: NodePath | null = inner;
  while (current) {
    if (current === outer) return true;
    current = current.parentPath;
  }
  return false;
}
