"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.noStylesheetCreate = noStylesheetCreate;
const traverse_1 = __importDefault(require("@babel/traverse"));
const RULE_NAME = 'no-stylesheet-create';
function noStylesheetCreate(ast, _code) {
    const results = [];
    (0, traverse_1.default)(ast, {
        CallExpression(path) {
            const { callee, loc } = path.node;
            // Check for StyleSheet.create()
            if (callee.type === 'MemberExpression' &&
                callee.object.type === 'Identifier' &&
                callee.object.name === 'StyleSheet' &&
                callee.property.type === 'Identifier' &&
                callee.property.name === 'create') {
                results.push({
                    rule: RULE_NAME,
                    message: 'Use inline styles instead of StyleSheet.create()',
                    line: loc?.start.line ?? 0,
                    column: loc?.start.column ?? 0,
                    severity: 'warning',
                });
            }
        },
    });
    return results;
}
