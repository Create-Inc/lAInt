"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.noSafeAreaView = noSafeAreaView;
const traverse_1 = __importDefault(require("@babel/traverse"));
const RULE_NAME = 'no-safeareaview';
function noSafeAreaView(ast, _code) {
    const results = [];
    (0, traverse_1.default)(ast, {
        JSXOpeningElement(path) {
            const { name, loc } = path.node;
            if (name.type === 'JSXIdentifier' && name.name === 'SafeAreaView') {
                results.push({
                    rule: RULE_NAME,
                    message: 'Use useSafeAreaInsets() hook instead of SafeAreaView for better layout control',
                    line: loc?.start.line ?? 0,
                    column: loc?.start.column ?? 0,
                    severity: 'warning',
                });
            }
        },
    });
    return results;
}
