"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.browserApiInUseEffect = browserApiInUseEffect;
const traverse_1 = __importDefault(require("@babel/traverse"));
const RULE_NAME = 'browser-api-in-useeffect';
const BROWSER_APIS = ['window', 'localStorage', 'sessionStorage', 'document'];
function browserApiInUseEffect(ast, _code) {
    const results = [];
    (0, traverse_1.default)(ast, {
        MemberExpression(path) {
            const { object, loc } = path.node;
            // Check if accessing browser APIs
            if (object.type !== 'Identifier' || !BROWSER_APIS.includes(object.name)) {
                return;
            }
            // Check if we're inside a useEffect callback
            let isInUseEffect = false;
            let isInConditional = false;
            let currentPath = path.parentPath;
            while (currentPath) {
                // Check if inside useEffect
                if (currentPath.node.type === 'CallExpression' &&
                    currentPath.node.callee.type === 'Identifier' &&
                    currentPath.node.callee.name === 'useEffect') {
                    isInUseEffect = true;
                    break;
                }
                // Check if inside a typeof check (e.g., typeof window !== 'undefined')
                if (currentPath.node.type === 'IfStatement' ||
                    currentPath.node.type === 'ConditionalExpression') {
                    const test = currentPath.node.test;
                    if (hasTypeofWindowCheck(test)) {
                        isInConditional = true;
                        break;
                    }
                }
                // Check if inside event handler (onClick, onSubmit, etc.)
                if (currentPath.node.type === 'JSXAttribute' &&
                    currentPath.node.name.type === 'JSXIdentifier' &&
                    currentPath.node.name.name.startsWith('on')) {
                    isInUseEffect = true; // Event handlers are safe
                    break;
                }
                currentPath = currentPath.parentPath;
            }
            if (!isInUseEffect && !isInConditional) {
                results.push({
                    rule: RULE_NAME,
                    message: `Access to '${object.name}' should be inside useEffect() or behind a typeof check for SSR compatibility`,
                    line: loc?.start.line ?? 0,
                    column: loc?.start.column ?? 0,
                    severity: 'warning',
                });
            }
        },
    });
    return results;
}
function hasTypeofWindowCheck(node) {
    if (!node)
        return false;
    // typeof window !== 'undefined'
    if (node.type === 'BinaryExpression' &&
        node.left?.type === 'UnaryExpression' &&
        node.left.operator === 'typeof' &&
        node.left.argument?.type === 'Identifier' &&
        BROWSER_APIS.includes(node.left.argument.name)) {
        return true;
    }
    // Recursive check for logical expressions
    if (node.type === 'LogicalExpression') {
        return hasTypeofWindowCheck(node.left) || hasTypeofWindowCheck(node.right);
    }
    return false;
}
