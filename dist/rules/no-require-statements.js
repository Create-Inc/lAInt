import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;
const RULE_NAME = 'no-require-statements';
export function noRequireStatements(ast, _code) {
    const results = [];
    traverse(ast, {
        CallExpression(path) {
            const { callee, loc } = path.node;
            if (callee.type === 'Identifier' && callee.name === 'require') {
                results.push({
                    rule: RULE_NAME,
                    message: 'Use import statements instead of require()',
                    line: loc?.start.line ?? 0,
                    column: loc?.start.column ?? 0,
                    severity: 'error',
                });
            }
        },
    });
    return results;
}
