"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.noClassComponents = noClassComponents;
const traverse_1 = __importDefault(require("@babel/traverse"));
const RULE_NAME = 'no-class-components';
function noClassComponents(ast, _code) {
    const results = [];
    (0, traverse_1.default)(ast, {
        ClassDeclaration(path) {
            const { superClass, loc, id } = path.node;
            // Check if class extends Component or React.Component or PureComponent
            let isReactComponent = false;
            if (superClass?.type === 'Identifier') {
                isReactComponent = ['Component', 'PureComponent'].includes(superClass.name);
            }
            else if (superClass?.type === 'MemberExpression' &&
                superClass.object.type === 'Identifier' &&
                superClass.object.name === 'React' &&
                superClass.property.type === 'Identifier') {
                isReactComponent = ['Component', 'PureComponent'].includes(superClass.property.name);
            }
            if (isReactComponent) {
                const className = id?.name ?? 'Anonymous';
                results.push({
                    rule: RULE_NAME,
                    message: `Convert class component "${className}" to a function component with hooks`,
                    line: loc?.start.line ?? 0,
                    column: loc?.start.column ?? 0,
                    severity: 'warning',
                });
            }
        },
    });
    return results;
}
