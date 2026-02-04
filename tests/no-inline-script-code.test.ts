import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['no-inline-script-code'] };

describe('no-inline-script-code rule', () => {
  it('should allow script with src attribute', () => {
    const code = `<script src="https://example.com/script.js" />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow script with template literal', () => {
    const code = "<script>{`console.log('hello');`}</script>";
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect script with string literal', () => {
    const code = `<script>{"console.log('hello');"}</script>`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-inline-script-code');
    expect(results[0].message).toContain('template literals');
  });

  it('should allow empty script', () => {
    const code = `<script></script>`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow self-closing script with src', () => {
    const code = `<script src="https://cdn.example.com/lib.js" />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
