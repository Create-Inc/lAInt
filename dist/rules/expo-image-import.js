"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expoImageImport = expoImageImport;
const traverse_1 = __importDefault(require("@babel/traverse"));
const RULE_NAME = 'expo-image-import';
function expoImageImport(ast, _code) {
    const results = [];
    (0, traverse_1.default)(ast, {
        ImportDeclaration(path) {
            const { source, specifiers, loc } = path.node;
            // Check for imports from 'react-native'
            if (source.value === 'react-native') {
                for (const specifier of specifiers) {
                    if (specifier.type === 'ImportSpecifier' &&
                        specifier.imported.type === 'Identifier' &&
                        specifier.imported.name === 'Image') {
                        results.push({
                            rule: RULE_NAME,
                            message: "Import Image from 'expo-image' instead of 'react-native' for Expo apps",
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
