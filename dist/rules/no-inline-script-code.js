"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.noInlineScriptCode = noInlineScriptCode;
const traverse_1 = __importDefault(require("@babel/traverse"));
const RULE_NAME = 'no-inline-script-code';
function noInlineScriptCode(ast, _code) {
    const results = [];
    (0, traverse_1.default)(ast, {
        JSXElement(path) {
            const { openingElement, children, loc } = path.node;
            if (openingElement.name.type !== 'JSXIdentifier' ||
                openingElement.name.name !== 'script') {
                return;
            }
            // Check if script has src attribute (allowed)
            const hasSrc = openingElement.attributes.some((attr) => attr.type === 'JSXAttribute' &&
                attr.name.type === 'JSXIdentifier' &&
                attr.name.name === 'src');
            if (hasSrc) {
                return; // Scripts with src are allowed
            }
            // Check children for inline code that's not a template literal
            for (const child of children) {
                // Direct text content is not allowed
                if (child.type === 'JSXText' && child.value.trim()) {
                    results.push({
                        rule: RULE_NAME,
                        message: 'Script tags with inline code should use template literals: <script>{`...code...`}</script>',
                        line: loc?.start.line ?? 0,
                        column: loc?.start.column ?? 0,
                        severity: 'error',
                    });
                    break;
                }
                // JSX expression is OK if it's a template literal
                if (child.type === 'JSXExpressionContainer') {
                    const expr = child.expression;
                    // String literals should be template literals
                    if (expr.type === 'StringLiteral') {
                        results.push({
                            rule: RULE_NAME,
                            message: 'Script tags with inline code should use template literals: <script>{`...code...`}</script>',
                            line: loc?.start.line ?? 0,
                            column: loc?.start.column ?? 0,
                            severity: 'warning',
                        });
                    }
                    // Template literals are fine
                }
            }
        },
    });
    return results;
}
