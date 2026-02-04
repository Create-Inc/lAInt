"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.headerShownFalse = headerShownFalse;
const traverse_1 = __importDefault(require("@babel/traverse"));
const RULE_NAME = 'header-shown-false';
function headerShownFalse(ast, _code) {
    const results = [];
    (0, traverse_1.default)(ast, {
        JSXOpeningElement(path) {
            const { name, attributes, loc } = path.node;
            // Check for Stack.Screen or Tabs.Screen
            if (name.type !== 'JSXMemberExpression') {
                return;
            }
            const isStackOrTabsScreen = name.object.type === 'JSXIdentifier' &&
                (name.object.name === 'Stack' || name.object.name === 'Tabs') &&
                name.property.type === 'JSXIdentifier' &&
                name.property.name === 'Screen';
            if (!isStackOrTabsScreen) {
                return;
            }
            // Check if this is the (tabs) screen in root layout
            let isTabsGroupScreen = false;
            for (const attr of attributes) {
                if (attr.type === 'JSXAttribute' &&
                    attr.name.type === 'JSXIdentifier' &&
                    attr.name.name === 'name') {
                    if (attr.value?.type === 'StringLiteral' &&
                        attr.value.value === '(tabs)') {
                        isTabsGroupScreen = true;
                        break;
                    }
                }
            }
            // For (tabs) screen, check that headerShown is false in options
            if (isTabsGroupScreen) {
                let hasHeaderShownFalse = false;
                for (const attr of attributes) {
                    if (attr.type === 'JSXAttribute' &&
                        attr.name.type === 'JSXIdentifier' &&
                        attr.name.name === 'options' &&
                        attr.value?.type === 'JSXExpressionContainer' &&
                        attr.value.expression.type === 'ObjectExpression') {
                        for (const prop of attr.value.expression.properties) {
                            if (prop.type === 'ObjectProperty' &&
                                prop.key.type === 'Identifier' &&
                                prop.key.name === 'headerShown' &&
                                prop.value.type === 'BooleanLiteral' &&
                                prop.value.value === false) {
                                hasHeaderShownFalse = true;
                            }
                        }
                    }
                }
                if (!hasHeaderShownFalse) {
                    results.push({
                        rule: RULE_NAME,
                        message: 'The (tabs) Screen should have options={{ headerShown: false }}',
                        line: loc?.start.line ?? 0,
                        column: loc?.start.column ?? 0,
                        severity: 'warning',
                    });
                }
            }
        },
    });
    return results;
}
