import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'no-unrestricted-loop-in-serverless';

export const meta = {
  name: 'no-unrestricted-loop-in-serverless',
  severity: 'error' as const,
  platforms: ['backend'] as Platform[] | null,
  category: 'Backend / SQL',
  description: 'Avoid unbounded loops that can time out serverless functions',
};

export function noUnrestrictedLoopInServerless(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    WhileStatement(path) {
      const { test, loc } = path.node;

      // while (true)
      if (t.isBooleanLiteral(test) && test.value) {
        if (!hasBreakOrReturn(path)) {
          results.push({
            rule: RULE_NAME,
            message:
              'Unbounded while(true) loop detected. In serverless functions this will cause a timeout. Add a loop counter, timeout, or maximum iteration limit',
            line: loc?.start.line ?? 0,
            column: loc?.start.column ?? 0,
            severity: 'error',
          });
        }
        return;
      }

      // while (1)
      if (t.isNumericLiteral(test) && test.value !== 0) {
        if (!hasBreakOrReturn(path)) {
          results.push({
            rule: RULE_NAME,
            message:
              'Unbounded while loop with truthy constant detected. In serverless functions this will cause a timeout. Add a loop counter, timeout, or maximum iteration limit',
            line: loc?.start.line ?? 0,
            column: loc?.start.column ?? 0,
            severity: 'error',
          });
        }
      }
    },

    ForStatement(path) {
      const { init, test, update, loc } = path.node;

      // for (;;) — all three parts missing
      if (!init && !test && !update) {
        if (!hasBreakOrReturn(path)) {
          results.push({
            rule: RULE_NAME,
            message:
              'Unbounded for(;;) loop detected. In serverless functions this will cause a timeout. Add a loop counter, timeout, or maximum iteration limit',
            line: loc?.start.line ?? 0,
            column: loc?.start.column ?? 0,
            severity: 'error',
          });
        }
        return;
      }

      // for (; true; ) — truthy constant test with no update
      if (!update && test && t.isBooleanLiteral(test) && test.value) {
        if (!hasBreakOrReturn(path)) {
          results.push({
            rule: RULE_NAME,
            message:
              'Unbounded for loop with no update and truthy test. In serverless functions this will cause a timeout. Add a termination condition',
            line: loc?.start.line ?? 0,
            column: loc?.start.column ?? 0,
            severity: 'error',
          });
        }
      }
    },
  });

  return results;
}

function hasBreakOrReturn(loopPath: any): boolean {
  let found = false;

  loopPath.traverse({
    BreakStatement(innerPath: any) {
      // Only count break if it targets this loop (not a nested loop)
      const label = innerPath.node.label;
      if (!label) {
        // Unlabeled break — check it's not inside a nested loop or switch
        let parent = innerPath.parentPath;
        while (parent && parent !== loopPath) {
          const type = parent.node.type;
          if (
            type === 'ForStatement' ||
            type === 'WhileStatement' ||
            type === 'DoWhileStatement' ||
            type === 'ForInStatement' ||
            type === 'ForOfStatement' ||
            type === 'SwitchStatement'
          ) {
            return; // break belongs to a nested construct
          }
          parent = parent.parentPath;
        }
        found = true;
        innerPath.stop();
      }
    },

    ReturnStatement(innerPath: any) {
      // Check the return is not inside a nested function
      let parent = innerPath.parentPath;
      while (parent && parent !== loopPath) {
        if (
          parent.node.type === 'FunctionDeclaration' ||
          parent.node.type === 'FunctionExpression' ||
          parent.node.type === 'ArrowFunctionExpression'
        ) {
          return; // return belongs to a nested function
        }
        parent = parent.parentPath;
      }
      found = true;
      innerPath.stop();
    },
  });

  return found;
}
