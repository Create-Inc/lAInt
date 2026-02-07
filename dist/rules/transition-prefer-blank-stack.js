import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;
const RULE_NAME = 'transition-prefer-blank-stack';
export function transitionPreferBlankStack(ast, _code) {
    const results = [];
    traverse(ast, {
        ObjectProperty(path) {
            const { key, value, loc } = path.node;
            const keyName = key.type === 'Identifier'
                ? key.name
                : key.type === 'StringLiteral'
                    ? key.value
                    : null;
            if (keyName !== 'enableTransitions')
                return;
            if (value.type === 'BooleanLiteral' &&
                value.value === true) {
                results.push({
                    rule: RULE_NAME,
                    message: 'Consider using Blank Stack from react-native-screen-transitions instead of enableTransitions on Native Stack. Blank Stack avoids delayed touch events and edge cases',
                    line: loc?.start.line ?? 0,
                    column: loc?.start.column ?? 0,
                    severity: 'warning',
                });
            }
        },
    });
    return results;
}
