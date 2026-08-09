import traverse from '@babel/traverse';
import type {
  ArrowFunctionExpression,
  File,
  FunctionDeclaration,
  FunctionExpression,
} from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'no-empty-screen-component';

export const meta = {
  name: 'no-empty-screen-component',
  severity: 'error' as const,
  platforms: ['expo', 'web'] as Platform[] | null,
  category: 'React / JSX',
  description: 'A default-exported screen/route component must render UI, not `return null`',
};

type ComponentFn = FunctionDeclaration | FunctionExpression | ArrowFunctionExpression;

/**
 * True when the function unconditionally renders nothing: its body is a single
 * `return` of null / undefined / empty fragment (or an implicit `return null`),
 * with no other statements and no other return paths. A concise-body arrow
 * (`() => null`) counts too.
 *
 * We deliberately do NOT flag components that have any conditional return, any
 * other statement, or that return real JSX anywhere. A loading gate, an auth
 * guard, or a `+not-found` screen all have branches or real JSX and are left
 * alone. This targets only the orphan stub `export default function X(){ return
 * null; }` that ships a blank "/" route.
 */
function rendersNothing(fn: ComponentFn): boolean {
  const body = fn.body;

  // Concise arrow body: () => null | () => undefined
  if (body.type !== 'BlockStatement') {
    return (
      body.type === 'NullLiteral' ||
      (body.type === 'Identifier' && body.name === 'undefined') ||
      isEmptyFragment(body)
    );
  }

  const statements = body.body;
  if (statements.length !== 1) {
    return false;
  }

  const only = statements[0];
  if (only.type !== 'ReturnStatement') {
    return false;
  }

  const arg = only.argument;
  // `return;` (implicit undefined), `return null;`, `return undefined;`, `return <></>;`
  if (arg === null || arg === undefined) {
    return true;
  }
  if (arg.type === 'NullLiteral') {
    return true;
  }
  if (arg.type === 'Identifier' && arg.name === 'undefined') {
    return true;
  }
  return isEmptyFragment(arg);
}

function isEmptyFragment(node: { type: string; children?: unknown[] }): boolean {
  // Only a fragment (`<></>` / `<>   </>`) renders nothing. A real JSX element
  // like `<View />` renders UI even with no children, so it is NOT empty.
  if (node.type !== 'JSXFragment') {
    return false;
  }
  const children = (node.children ?? []) as Array<{ type: string; value?: string }>;
  return children.every((c) => c.type === 'JSXText' && (c.value ?? '').trim() === '');
}

/**
 * A component looks like a screen/route component when its name is PascalCase
 * (React convention) or it is an anonymous default-exported function. Helper
 * functions that legitimately return null are typically camelCase or not the
 * default export, so this keeps the rule focused on rendered components.
 */
function looksLikeComponentName(name: string | null | undefined): boolean {
  if (!name) {
    return true; // anonymous default export -> treat as a component
  }
  return /^[A-Z]/.test(name);
}

export function noEmptyScreenComponent(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  const report = (fn: ComponentFn, name: string | null | undefined) => {
    if (!looksLikeComponentName(name)) {
      return;
    }
    if (!rendersNothing(fn)) {
      return;
    }
    const loc = fn.loc;
    results.push({
      rule: RULE_NAME,
      message:
        'This default-exported screen renders nothing (`return null`). A route/screen ' +
        'component must render UI, or the app shows a blank screen. If real content ' +
        'lives in a route group (e.g. `(tabs)/index.tsx`), point this route at it or ' +
        'move the content here.',
      line: loc?.start.line ?? 0,
      column: loc?.start.column ?? 0,
      severity: 'error',
    });
  };

  traverse(ast, {
    ExportDefaultDeclaration(path) {
      const decl = path.node.declaration;

      // export default function Foo() {}
      if (decl.type === 'FunctionDeclaration') {
        report(decl, decl.id?.name ?? null);
        return;
      }

      // export default () => null  /  export default function () {}
      if (decl.type === 'ArrowFunctionExpression' || decl.type === 'FunctionExpression') {
        report(decl, decl.type === 'FunctionExpression' ? (decl.id?.name ?? null) : null);
        return;
      }

      // export default Foo  (identifier) -> resolve to the declaration in scope
      if (decl.type === 'Identifier') {
        const name = decl.name;
        const binding = path.scope.getBinding(name);
        const node = binding?.path.node;
        if (!node) {
          return;
        }
        if (node.type === 'FunctionDeclaration') {
          report(node, node.id?.name ?? name);
          return;
        }
        if (
          node.type === 'VariableDeclarator' &&
          node.init &&
          (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression')
        ) {
          report(node.init, name);
        }
      }
    },
  });

  return results;
}
