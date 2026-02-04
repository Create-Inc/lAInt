import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;
const RULE_NAME = 'no-safeareaview';
export function noSafeAreaView(ast, _code) {
    const results = [];
    traverse(ast, {
        JSXOpeningElement(path) {
            const { name, loc } = path.node;
            if (name.type === 'JSXIdentifier' && name.name === 'SafeAreaView') {
                results.push({
                    rule: RULE_NAME,
                    message: 'Use useSafeAreaInsets() hook instead of SafeAreaView for better layout control',
                    line: loc?.start.line ?? 0,
                    column: loc?.start.column ?? 0,
                    severity: 'warning',
                });
            }
        },
    });
    return results;
}
