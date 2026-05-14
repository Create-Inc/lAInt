import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult, Platform } from '../types';

const RULE_NAME = 'no-class-components';

export const meta = {
  name: 'no-class-components',
  severity: 'warning' as const,
  platforms: ['expo', 'web'] as Platform[] | null,
  category: 'React / JSX',
  description: 'Use function components with hooks',
};

export function noClassComponents(ast: File, _code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    ClassDeclaration(path) {
      const { superClass, loc, id } = path.node;

      // Check if class extends Component or React.Component or PureComponent
      let isReactComponent = false;

      if (superClass?.type === 'Identifier') {
        isReactComponent = ['Component', 'PureComponent'].includes(superClass.name);
      } else if (
        superClass?.type === 'MemberExpression' &&
        superClass.object.type === 'Identifier' &&
        superClass.object.name === 'React' &&
        superClass.property.type === 'Identifier'
      ) {
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
