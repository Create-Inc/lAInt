import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;
const RULE_NAME = 'no-stylesheet-create';
export function noStylesheetCreate(ast, _code) {
    const results = [];
    traverse(ast, {
        CallExpression(path) {
            const { callee, loc } = path.node;
            // Check for StyleSheet.create()
            if (callee.type === 'MemberExpression' &&
                callee.object.type === 'Identifier' &&
                callee.object.name === 'StyleSheet' &&
                callee.property.type === 'Identifier' &&
                callee.property.name === 'create') {
                results.push({
                    rule: RULE_NAME,
                    message: 'Use inline styles instead of StyleSheet.create()',
                    line: loc?.start.line ?? 0,
                    column: loc?.start.column ?? 0,
                    severity: 'warning',
                });
            }
        },
    });
    return results;
}
