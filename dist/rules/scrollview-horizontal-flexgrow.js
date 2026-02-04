"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrollviewHorizontalFlexgrow = scrollviewHorizontalFlexgrow;
const traverse_1 = __importDefault(require("@babel/traverse"));
const RULE_NAME = 'scrollview-horizontal-flexgrow';
function scrollviewHorizontalFlexgrow(ast, _code) {
    const results = [];
    (0, traverse_1.default)(ast, {
        JSXOpeningElement(path) {
            const { name, attributes, loc } = path.node;
            if (name.type !== 'JSXIdentifier' || name.name !== 'ScrollView') {
                return;
            }
            let hasHorizontal = false;
            let hasFlexGrowZero = false;
            for (const attr of attributes) {
                if (attr.type !== 'JSXAttribute' || attr.name.type !== 'JSXIdentifier') {
                    continue;
                }
                // Check for horizontal prop (can be just `horizontal` or `horizontal={true}`)
                if (attr.name.name === 'horizontal') {
                    const attrValue = attr.value;
                    if (attrValue == null) {
                        // <ScrollView horizontal />
                        hasHorizontal = true;
                    }
                    else if (attrValue.type === 'JSXExpressionContainer') {
                        const expr = attrValue.expression;
                        if (expr.type === 'BooleanLiteral' && expr.value === true) {
                            // <ScrollView horizontal={true} />
                            hasHorizontal = true;
                        }
                    }
                }
                // Check for style prop with flexGrow: 0
                const styleValue = attr.value;
                if (attr.name.name === 'style' && styleValue?.type === 'JSXExpressionContainer') {
                    const expr = styleValue.expression;
                    if (expr.type === 'ObjectExpression') {
                        for (const prop of expr.properties) {
                            if (prop.type === 'ObjectProperty' &&
                                prop.key.type === 'Identifier' &&
                                prop.key.name === 'flexGrow' &&
                                prop.value.type === 'NumericLiteral' &&
                                prop.value.value === 0) {
                                hasFlexGrowZero = true;
                            }
                        }
                    }
                }
            }
            if (hasHorizontal && !hasFlexGrowZero) {
                results.push({
                    rule: RULE_NAME,
                    message: 'Horizontal ScrollView should have style={{ flexGrow: 0 }} to prevent stretching of elements inside',
                    line: loc?.start.line ?? 0,
                    column: loc?.start.column ?? 0,
                    severity: 'warning',
                });
            }
        },
    });
    return results;
}
