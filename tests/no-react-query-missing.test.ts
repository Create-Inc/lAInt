import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['no-react-query-missing'] };

describe('no-react-query-missing rule', () => {
  it('should detect fetch in useEffect without react-query', () => {
    const code = `
      function Component() {
        useEffect(() => {
          fetch('/api/data').then(res => res.json());
        }, []);
        return <div>Data</div>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-react-query-missing');
    expect(results[0].message).toContain('@tanstack/react-query');
    expect(results[0].severity).toBe('warning');
  });

  it('should allow fetch with react-query imported', () => {
    const code = `
      import { useQuery } from '@tanstack/react-query';

      function Component() {
        useEffect(() => {
          fetch('/api/data');
        }, []);
        return <div>Data</div>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow fetch outside useEffect', () => {
    const code = `
      async function fetchData() {
        return fetch('/api/data');
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow code without fetch', () => {
    const code = `
      function Component() {
        useEffect(() => {
          console.log('mounted');
        }, []);
        return <div>Hello</div>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect with legacy react-query import', () => {
    const code = `
      import { useQuery } from 'react-query';

      function Component() {
        useEffect(() => {
          fetch('/api/data');
        }, []);
        return <div>Data</div>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
