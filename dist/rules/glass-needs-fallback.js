"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.glassNeedsFallback = glassNeedsFallback;
const traverse_1 = __importDefault(require("@babel/traverse"));
const RULE_NAME = 'glass-needs-fallback';
function glassNeedsFallback(ast, _code) {
    const results = [];
    let hasGlassViewUsage = false;
    let hasLiquidGlassCheck = false;
    let glassViewLoc = null;
    (0, traverse_1.default)(ast, {
        JSXOpeningElement(path) {
            const { name, loc } = path.node;
            if (name.type === 'JSXIdentifier' && name.name === 'GlassView') {
                hasGlassViewUsage = true;
                if (!glassViewLoc) {
                    glassViewLoc = {
                        line: loc?.start.line ?? 0,
                        column: loc?.start.column ?? 0,
                    };
                }
            }
        },
        CallExpression(path) {
            const { callee } = path.node;
            // Check for isLiquidGlassAvailable() call
            if (callee.type === 'Identifier' &&
                callee.name === 'isLiquidGlassAvailable') {
                hasLiquidGlassCheck = true;
            }
        },
    });
    if (hasGlassViewUsage && !hasLiquidGlassCheck && glassViewLoc !== null) {
        const { line, column } = glassViewLoc;
        results.push({
            rule: RULE_NAME,
            message: 'GlassView requires fallback UI. Use isLiquidGlassAvailable() to check support before rendering GlassView',
            line,
            column,
            severity: 'warning',
        });
    }
    return results;
}
