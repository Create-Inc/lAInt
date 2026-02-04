"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqlNoNestedCalls = sqlNoNestedCalls;
const traverse_1 = __importDefault(require("@babel/traverse"));
const RULE_NAME = 'sql-no-nested-calls';
function sqlNoNestedCalls(ast, _code) {
    const results = [];
    (0, traverse_1.default)(ast, {
        TaggedTemplateExpression(path) {
            const { tag, quasi, loc } = path.node;
            // Check if this is a sql`` template tag
            if (tag.type !== 'Identifier' || tag.name !== 'sql') {
                return;
            }
            // Check the expressions inside the template literal for nested sql calls
            for (const expr of quasi.expressions) {
                // Check for sql`` nested inside
                if (expr.type === 'TaggedTemplateExpression' &&
                    expr.tag.type === 'Identifier' &&
                    expr.tag.name === 'sql') {
                    results.push({
                        rule: RULE_NAME,
                        message: 'Never nest sql template tags. Build the query string separately and use the function form: sql(queryString, values)',
                        line: expr.loc?.start.line ?? 0,
                        column: expr.loc?.start.column ?? 0,
                        severity: 'error',
                    });
                }
                // Check for sql() function call nested inside
                if (expr.type === 'CallExpression' &&
                    expr.callee.type === 'Identifier' &&
                    expr.callee.name === 'sql') {
                    results.push({
                        rule: RULE_NAME,
                        message: 'Never nest sql calls inside sql template tags. Build dynamic queries separately using the function form.',
                        line: expr.loc?.start.line ?? 0,
                        column: expr.loc?.start.column ?? 0,
                        severity: 'error',
                    });
                }
                // Check for variables that might be sql results being interpolated
                // This is a heuristic - check if a variable named 'query' is being used
                if (expr.type === 'Identifier' && expr.name === 'query') {
                    // Check if 'query' was assigned from a sql call in this scope
                    const binding = path.scope.getBinding('query');
                    if (binding?.path.node.type === 'VariableDeclarator') {
                        const init = binding.path.node.init;
                        if (init?.type === 'TaggedTemplateExpression' &&
                            init.tag?.type === 'Identifier' &&
                            init.tag.name === 'sql') {
                            results.push({
                                rule: RULE_NAME,
                                message: 'Never interpolate a sql query result into another sql template. Build the query string separately.',
                                line: loc?.start.line ?? 0,
                                column: loc?.start.column ?? 0,
                                severity: 'error',
                            });
                        }
                    }
                }
            }
        },
    });
    return results;
}
