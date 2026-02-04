import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;
const RULE_NAME = 'no-relative-paths';
function isRelativePath(path) {
    return path.startsWith('./') || path.startsWith('../');
}
function createLintResult(node, path, context) {
    return {
        rule: RULE_NAME,
        message: `Use absolute paths instead of relative paths in ${context}. Found: "${path}"`,
        line: node.loc?.start.line ?? 0,
        column: node.loc?.start.column ?? 0,
        severity: 'error',
    };
}
export function noRelativePaths(ast, _code) {
    const results = [];
    traverse(ast, {
        CallExpression(path) {
            const { callee, arguments: args } = path.node;
            // Check for router.navigate(), router.push(), router.replace()
            // Also handles getRouter().navigate(), etc.
            let methodName = null;
            if (callee.type === 'MemberExpression' &&
                callee.property.type === 'Identifier') {
                const propName = callee.property.name;
                if (['navigate', 'push', 'replace'].includes(propName)) {
                    methodName = propName;
                }
            }
            if (methodName && args.length > 0) {
                const firstArg = args[0];
                if (firstArg.type === 'StringLiteral' && isRelativePath(firstArg.value)) {
                    results.push(createLintResult(firstArg, firstArg.value, `router.${methodName}()`));
                }
            }
        },
        JSXOpeningElement(path) {
            const { name, attributes } = path.node;
            // Check for <Link href="...">
            if (name.type === 'JSXIdentifier' && name.name === 'Link') {
                for (const attr of attributes) {
                    if (attr.type === 'JSXAttribute' &&
                        attr.name.type === 'JSXIdentifier' &&
                        attr.name.name === 'href' &&
                        attr.value) {
                        // Handle href="string"
                        if (attr.value.type === 'StringLiteral' &&
                            isRelativePath(attr.value.value)) {
                            results.push(createLintResult(attr.value, attr.value.value, '<Link href>'));
                        }
                        // Handle href={"string"}
                        else if (attr.value.type === 'JSXExpressionContainer' &&
                            attr.value.expression.type === 'StringLiteral' &&
                            isRelativePath(attr.value.expression.value)) {
                            const expr = attr.value.expression;
                            results.push(createLintResult(expr, expr.value, '<Link href>'));
                        }
                    }
                }
            }
        },
    });
    return results;
}
