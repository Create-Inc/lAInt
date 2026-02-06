import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;
const RULE_NAME = 'transition-gesture-scrollview';
const COMPONENTS_TO_REPLACE = {
    ScrollView: 'Transition.ScrollView',
    FlatList: 'Transition.FlatList',
};
export function transitionGestureScrollview(ast, _code) {
    const results = [];
    let hasTransitionImport = false;
    // First pass: check for react-native-screen-transitions import
    traverse(ast, {
        ImportDeclaration(path) {
            if (path.node.source.value === 'react-native-screen-transitions') {
                hasTransitionImport = true;
            }
        },
    });
    if (!hasTransitionImport)
        return results;
    // Second pass: find regular ScrollView / FlatList usage
    traverse(ast, {
        JSXOpeningElement(path) {
            const { name, loc } = path.node;
            if (name.type !== 'JSXIdentifier')
                return;
            const replacement = COMPONENTS_TO_REPLACE[name.name];
            if (!replacement)
                return;
            results.push({
                rule: RULE_NAME,
                message: `Use ${replacement} instead of ${name.name} inside screen transition screens to prevent gesture conflicts`,
                line: loc?.start.line ?? 0,
                column: loc?.start.column ?? 0,
                severity: 'warning',
            });
        },
    });
    return results;
}
