import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;
const RULE_NAME = 'native-tabs-bottom-padding';
export function nativeTabsBottomPadding(ast, _code) {
    const results = [];
    let hasNativeTabsImport = false;
    let nativeTabsUsageLoc = null;
    traverse(ast, {
        ImportDeclaration(path) {
            const { source, specifiers } = path.node;
            // Check for NativeTabs import from expo-router/unstable-native-tabs
            if (source.value === 'expo-router/unstable-native-tabs') {
                for (const spec of specifiers) {
                    if (spec.type === 'ImportSpecifier' &&
                        spec.imported.type === 'Identifier' &&
                        spec.imported.name === 'NativeTabs') {
                        hasNativeTabsImport = true;
                        break;
                    }
                }
            }
        },
        JSXOpeningElement(path) {
            const { name, loc } = path.node;
            if (name.type === 'JSXIdentifier' && name.name === 'NativeTabs') {
                nativeTabsUsageLoc = {
                    line: loc?.start.line ?? 0,
                    column: loc?.start.column ?? 0,
                };
            }
        },
    });
    // If NativeTabs is used, remind about bottom padding
    if (hasNativeTabsImport && nativeTabsUsageLoc !== null) {
        const { line, column } = nativeTabsUsageLoc;
        results.push({
            rule: RULE_NAME,
            message: 'When using NativeTabs, add 64px of padding/margin to the bottom of each screen to prevent content overlap with the tab bar',
            line,
            column,
            severity: 'warning',
        });
    }
    return results;
}
