import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;
const RULE_NAME = 'no-tab-bar-height';
export function noTabBarHeight(ast, _code) {
    const results = [];
    traverse(ast, {
        JSXAttribute(path) {
            const { name, value } = path.node;
            // Look for screenOptions or options attribute
            if (name.type === 'JSXIdentifier' &&
                (name.name === 'screenOptions' || name.name === 'options')) {
                // Check if value is an object expression (inline or via JSXExpressionContainer)
                if (value?.type === 'JSXExpressionContainer') {
                    const expr = value.expression;
                    if (expr.type === 'ObjectExpression') {
                        checkForTabBarHeight(expr.properties, results);
                    }
                }
            }
        },
    });
    return results;
}
function checkForTabBarHeight(properties, results) {
    for (const prop of properties) {
        if (prop.type !== 'ObjectProperty')
            continue;
        // Check for tabBarStyle property
        if (prop.key.type === 'Identifier' &&
            prop.key.name === 'tabBarStyle' &&
            prop.value.type === 'ObjectExpression') {
            // Check if tabBarStyle contains height
            for (const styleProp of prop.value.properties) {
                if (styleProp.type === 'ObjectProperty' &&
                    styleProp.key.type === 'Identifier' &&
                    styleProp.key.name === 'height') {
                    results.push({
                        rule: RULE_NAME,
                        message: 'Never set height for tabs in tabBarStyle - let it be automatically computed for iOS guidelines compliance',
                        line: styleProp.loc?.start.line ?? 0,
                        column: styleProp.loc?.start.column ?? 0,
                        severity: 'error',
                    });
                }
            }
        }
    }
}
