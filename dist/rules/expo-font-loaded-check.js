import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;
const RULE_NAME = 'expo-font-loaded-check';
export function expoFontLoadedCheck(ast, _code) {
    const results = [];
    let usesFontsCall = null;
    let hasLoadedCheck = false;
    traverse(ast, {
        CallExpression(path) {
            const { callee, loc } = path.node;
            // Check for useFonts() call
            if (callee.type === 'Identifier' && callee.name === 'useFonts') {
                usesFontsCall = {
                    line: loc?.start.line ?? 0,
                    column: loc?.start.column ?? 0,
                };
            }
        },
        // Check for loaded/error checks in if statements or conditionals
        IfStatement(path) {
            const { test } = path.node;
            // Check for `if (!loaded)` or `if (!loaded && !error)` patterns
            if (checkForLoadedReference(test)) {
                hasLoadedCheck = true;
            }
        },
        ConditionalExpression(path) {
            const { test } = path.node;
            if (checkForLoadedReference(test)) {
                hasLoadedCheck = true;
            }
        },
        LogicalExpression(path) {
            const { left, right } = path.node;
            if (checkForLoadedReference(left) || checkForLoadedReference(right)) {
                hasLoadedCheck = true;
            }
        },
    });
    if (usesFontsCall !== null && !hasLoadedCheck) {
        const { line, column } = usesFontsCall;
        results.push({
            rule: RULE_NAME,
            message: 'useFonts() requires checking if fonts are loaded before rendering. Add: if (!loaded && !error) return null;',
            line,
            column,
            severity: 'error',
        });
    }
    return results;
}
function checkForLoadedReference(node) {
    if (!node)
        return false;
    // Direct identifier check
    if (node.type === 'Identifier' && node.name === 'loaded') {
        return true;
    }
    // Unary expression: !loaded
    if (node.type === 'UnaryExpression' &&
        node.operator === '!' &&
        node.argument?.type === 'Identifier' &&
        node.argument.name === 'loaded') {
        return true;
    }
    // Check nested expressions
    if (node.type === 'LogicalExpression') {
        return checkForLoadedReference(node.left) || checkForLoadedReference(node.right);
    }
    return false;
}
