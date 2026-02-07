import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;
const RULE_NAME = 'transition-progress-range';
export function transitionProgressRange(ast, _code) {
    const results = [];
    // Track whether we're inside a screenStyleInterpolator
    let insideInterpolator = false;
    traverse(ast, {
        ObjectProperty: {
            enter(path) {
                const { key } = path.node;
                const keyName = key.type === 'Identifier'
                    ? key.name
                    : key.type === 'StringLiteral'
                        ? key.value
                        : null;
                if (keyName === 'screenStyleInterpolator') {
                    insideInterpolator = true;
                }
            },
            exit(path) {
                const { key } = path.node;
                const keyName = key.type === 'Identifier'
                    ? key.name
                    : key.type === 'StringLiteral'
                        ? key.value
                        : null;
                if (keyName === 'screenStyleInterpolator') {
                    insideInterpolator = false;
                }
            },
        },
        CallExpression(path) {
            if (!insideInterpolator)
                return;
            const { callee, loc } = path.node;
            // Check if callee is `interpolate`
            if (callee.type !== 'Identifier' || callee.name !== 'interpolate')
                return;
            const args = path.node.arguments;
            // The 2nd argument is the input range array
            if (args.length < 2)
                return;
            const inputRange = args[1];
            if (inputRange.type !== 'ArrayExpression')
                return;
            const elements = inputRange.elements;
            // Check if max value is only 1 (missing exit phase 1→2)
            const numericValues = elements
                .filter((el) => el !== null && el.type === 'NumericLiteral')
                .map((el) => el.value);
            if (numericValues.length < 2)
                return;
            const maxValue = Math.max(...numericValues);
            if (maxValue <= 1) {
                results.push({
                    rule: RULE_NAME,
                    message: 'interpolate() in screen transitions should cover the full range [0, 1, 2] including the exit phase (1→2). Missing exit phase causes abrupt screen dismissals',
                    line: loc?.start.line ?? 0,
                    column: loc?.start.column ?? 0,
                    severity: 'warning',
                });
            }
        },
    });
    return results;
}
