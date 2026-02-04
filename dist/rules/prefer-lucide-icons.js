"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.preferLucideIcons = preferLucideIcons;
const traverse_1 = __importDefault(require("@babel/traverse"));
const RULE_NAME = 'prefer-lucide-icons';
// Common icon libraries that should be replaced with lucide
const DISCOURAGED_ICON_PACKAGES = [
    '@expo/vector-icons',
    'react-native-vector-icons',
    '@react-native-vector-icons/fontawesome',
    '@react-native-vector-icons/material-icons',
    'react-icons',
];
function preferLucideIcons(ast, _code) {
    const results = [];
    (0, traverse_1.default)(ast, {
        ImportDeclaration(path) {
            const { source, loc } = path.node;
            const packageName = source.value;
            // Check if importing from discouraged icon packages
            if (DISCOURAGED_ICON_PACKAGES.some((pkg) => packageName === pkg || packageName.startsWith(pkg + '/'))) {
                results.push({
                    rule: RULE_NAME,
                    message: `Prefer 'lucide-react' (web) or 'lucide-react-native' (mobile) over '${packageName}'`,
                    line: loc?.start.line ?? 0,
                    column: loc?.start.column ?? 0,
                    severity: 'warning',
                });
            }
        },
    });
    return results;
}
