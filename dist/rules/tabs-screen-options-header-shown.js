"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tabsScreenOptionsHeaderShown = tabsScreenOptionsHeaderShown;
const traverse_1 = __importDefault(require("@babel/traverse"));
const RULE_NAME = 'tabs-screen-options-header-shown';
function tabsScreenOptionsHeaderShown(ast, _code) {
    const results = [];
    (0, traverse_1.default)(ast, {
        JSXOpeningElement(path) {
            const { name, attributes, loc } = path.node;
            // Check for <Tabs component with screenOptions
            if (name.type !== 'JSXIdentifier' || name.name !== 'Tabs') {
                return;
            }
            // Look for screenOptions attribute
            for (const attr of attributes) {
                if (attr.type !== 'JSXAttribute' ||
                    attr.name.type !== 'JSXIdentifier' ||
                    attr.name.name !== 'screenOptions') {
                    continue;
                }
                // Check if screenOptions has headerShown: false
                if (attr.value?.type === 'JSXExpressionContainer' &&
                    attr.value.expression.type === 'ObjectExpression') {
                    let hasHeaderShownFalse = false;
                    for (const prop of attr.value.expression.properties) {
                        if (prop.type === 'ObjectProperty' &&
                            prop.key.type === 'Identifier' &&
                            prop.key.name === 'headerShown' &&
                            prop.value.type === 'BooleanLiteral' &&
                            prop.value.value === false) {
                            hasHeaderShownFalse = true;
                            break;
                        }
                    }
                    if (!hasHeaderShownFalse) {
                        results.push({
                            rule: RULE_NAME,
                            message: 'Tabs screenOptions should include headerShown: false for proper Expo Router navigation',
                            line: loc?.start.line ?? 0,
                            column: loc?.start.column ?? 0,
                            severity: 'warning',
                        });
                    }
                }
            }
        },
    });
    return results;
}
