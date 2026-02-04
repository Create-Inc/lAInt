import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['fetch-response-ok-check'] };

describe('fetch-response-ok-check rule', () => {
  it('should detect fetch without response.ok check', () => {
    const code = `
      async function getData() {
        const response = await fetch('/api/data');
        const data = await response.json();
        return data;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('fetch-response-ok-check');
    expect(results[0].message).toContain('response.ok');
    expect(results[0].severity).toBe('warning');
  });

  it('should allow fetch with response.ok check', () => {
    const code = `
      async function getData() {
        const response = await fetch('/api/data');
        if (!response.ok) {
          throw new Error('Failed to fetch');
        }
        const data = await response.json();
        return data;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow code without fetch', () => {
    const code = `
      function Component() {
        return <div>Hello</div>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow fetch with ok property access', () => {
    const code = `
      async function postData() {
        const res = await fetch('/api/submit', { method: 'POST' });
        if (res.ok) {
          return res.json();
        }
        throw new Error('Submit failed');
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
