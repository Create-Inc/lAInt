import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['no-class-components'] };

describe('no-class-components rule', () => {
  it('should detect class extending Component', () => {
    const code = `
      class MyComponent extends Component {
        render() {
          return <div>Hello</div>;
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-class-components');
    expect(results[0].message).toContain('MyComponent');
    expect(results[0].message).toContain('function component');
    expect(results[0].severity).toBe('warning');
  });

  it('should detect class extending React.Component', () => {
    const code = `
      class MyComponent extends React.Component {
        render() {
          return <div>Hello</div>;
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should detect class extending PureComponent', () => {
    const code = `
      class MyComponent extends PureComponent {
        render() {
          return <div>Hello</div>;
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should detect class extending React.PureComponent', () => {
    const code = `
      class MyComponent extends React.PureComponent {
        render() {
          return <div>Hello</div>;
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should allow function components', () => {
    const code = `
      function MyComponent() {
        return <div>Hello</div>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow arrow function components', () => {
    const code = `
      const MyComponent = () => {
        return <div>Hello</div>;
      };
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not flag non-React classes', () => {
    const code = `
      class MyService extends BaseService {
        getData() {
          return [];
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
