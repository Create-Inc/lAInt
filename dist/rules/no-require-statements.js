"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.noRequireStatements = noRequireStatements;
const traverse_1 = __importDefault(require("@babel/traverse"));
const RULE_NAME = 'no-require-statements';
function noRequireStatements(ast, _code) {
    const results = [];
    (0, traverse_1.default)(ast, {
        CallExpression(path) {
            const { callee, loc } = path.node;
            if (callee.type === 'Identifier' && callee.name === 'require') {
                results.push({
                    rule: RULE_NAME,
                    message: 'Use import statements instead of require()',
                    line: loc?.start.line ?? 0,
                    column: loc?.start.column ?? 0,
                    severity: 'error',
                });
            }
        },
    });
    return results;
}
