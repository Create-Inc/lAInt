"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.glassNoOpacityAnimation = glassNoOpacityAnimation;
const traverse_1 = __importDefault(require("@babel/traverse"));
const RULE_NAME = 'glass-no-opacity-animation';
function glassNoOpacityAnimation(ast, _code) {
    const results = [];
    (0, traverse_1.default)(ast, {
        JSXOpeningElement(path) {
            const { name, attributes, loc } = path.node;
            // Check for GlassView component
            if (name.type !== 'JSXIdentifier' || name.name !== 'GlassView') {
                return;
            }
            for (const attr of attributes) {
                if (attr.type !== 'JSXAttribute' ||
                    attr.name.type !== 'JSXIdentifier' ||
                    attr.name.name !== 'style') {
                    continue;
                }
                if (attr.value?.type !== 'JSXExpressionContainer') {
                    continue;
                }
                const expr = attr.value.expression;
                // Check for opacity in style object
                if (expr.type === 'ObjectExpression') {
                    checkForAnimatedOpacity(expr.properties, results, loc);
                }
                // Check for style array
                if (expr.type === 'ArrayExpression') {
                    for (const element of expr.elements) {
                        if (element?.type === 'ObjectExpression') {
                            checkForAnimatedOpacity(element.properties, results, loc);
                        }
                    }
                }
            }
        },
        // Also check for Animated.View wrapping GlassView with opacity
        CallExpression(path) {
            const { callee, arguments: args } = path.node;
            // Check for Animated.timing or similar with opacity
            if (callee.type === 'MemberExpression' &&
                callee.object.type === 'Identifier' &&
                callee.object.name === 'Animated' &&
                callee.property.type === 'Identifier' &&
                callee.property.name === 'timing') {
                // Check if the first argument references something with 'opacity' in the name
                if (args.length > 0 && args[0].type === 'Identifier') {
                    const varName = args[0].name.toLowerCase();
                    if (varName.includes('opacity')) {
                        // Check if this is related to glass
                        let parent = path.parentPath;
                        while (parent) {
                            if (parent.node.type === 'FunctionDeclaration' ||
                                parent.node.type === 'ArrowFunctionExpression') {
                                // Just warn generally about opacity animations potentially affecting glass
                                break;
                            }
                            parent = parent.parentPath;
                        }
                    }
                }
            }
        },
    });
    return results;
}
function checkForAnimatedOpacity(properties, results, loc) {
    for (const prop of properties) {
        if (prop.type !== 'ObjectProperty')
            continue;
        if (prop.key.type === 'Identifier' &&
            prop.key.name === 'opacity') {
            // Check if the value is animated (an Animated.Value or interpolation)
            const value = prop.value;
            // If opacity is a variable (potentially animated)
            if (value.type === 'Identifier') {
                results.push({
                    rule: RULE_NAME,
                    message: 'Avoid animating opacity on GlassView. Liquid glass relies on static opacity - changing it will break the glass effect.',
                    line: prop.loc?.start.line ?? loc?.start.line ?? 0,
                    column: prop.loc?.start.column ?? loc?.start.column ?? 0,
                    severity: 'warning',
                });
            }
            // If opacity is a call expression (like interpolation)
            if (value.type === 'CallExpression') {
                results.push({
                    rule: RULE_NAME,
                    message: 'Avoid animating opacity on GlassView. Liquid glass relies on static opacity - changing it will break the glass effect.',
                    line: prop.loc?.start.line ?? loc?.start.line ?? 0,
                    column: prop.loc?.start.column ?? loc?.start.column ?? 0,
                    severity: 'warning',
                });
            }
            // If opacity is a member expression (like animatedValue.interpolate())
            if (value.type === 'MemberExpression') {
                results.push({
                    rule: RULE_NAME,
                    message: 'Avoid animating opacity on GlassView. Liquid glass relies on static opacity - changing it will break the glass effect.',
                    line: prop.loc?.start.line ?? loc?.start.line ?? 0,
                    column: prop.loc?.start.column ?? loc?.start.column ?? 0,
                    severity: 'warning',
                });
            }
        }
    }
}
