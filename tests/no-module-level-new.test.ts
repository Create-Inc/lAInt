import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['no-module-level-new'] };

describe('no-module-level-new rule', () => {
  it('should flag new QueryClient() at module level', () => {
    const code = `
      import { QueryClient } from '@tanstack/react-query';
      const queryClient = new QueryClient();
      export default function Layout({ children }) {
        return <div>{children}</div>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-module-level-new');
    expect(results[0].message).toContain('new QueryClient()');
    expect(results[0].severity).toBe('error');
  });

  it('should flag new IntersectionObserver() at module level', () => {
    const code = `
      const observer = new IntersectionObserver(callback);
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].message).toContain('IntersectionObserver');
  });

  it('should flag unknown constructors at module level', () => {
    const code = `
      const thing = new SomeUnknownClass();
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].message).toContain('SomeUnknownClass');
  });

  it('should not flag new QueryClient() inside a function body', () => {
    const code = `
      function createClient() {
        return new QueryClient();
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not flag new QueryClient() inside useEffect callback', () => {
    const code = `
      function Component() {
        useEffect(() => {
          const qc = new QueryClient();
        }, []);
        return <div>Hello</div>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not flag new QueryClient() inside arrow function', () => {
    const code = `
      const makeClient = () => {
        return new QueryClient();
      };
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not flag new Error() at module level', () => {
    const code = `
      const NOT_FOUND = new Error('Not found');
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not flag new URL() at module level', () => {
    const code = `
      const baseUrl = new URL('https://example.com');
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not flag new Map() at module level', () => {
    const code = `
      const cache = new Map();
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not flag new RegExp() at module level', () => {
    const code = `
      const pattern = new RegExp('\\\\d+');
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not flag new Set() at module level', () => {
    const code = `
      const seen = new Set();
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not flag new Date() at module level', () => {
    const code = `
      const start = new Date();
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not flag constructors inside class methods', () => {
    const code = `
      class MyService {
        init() {
          this.client = new QueryClient();
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not flag constructors inside class bodies via property initializer', () => {
    const code = `
      class MyService {
        createClient() {
          return new QueryClient();
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should flag multiple module-level new expressions', () => {
    const code = `
      const a = new QueryClient();
      const b = new WebSocket('ws://localhost');
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(2);
  });
});
