import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['no-deprecated-url-parse'] };

describe('no-deprecated-url-parse rule', () => {
  it('should detect url.parse() with default import', () => {
    const code = `
      import url from 'url';
      const parsed = url.parse('https://example.com');
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-deprecated-url-parse');
    expect(results[0].message).toContain('deprecated');
    expect(results[0].message).toContain('new URL');
    expect(results[0].severity).toBe('warning');
  });

  it('should detect url.parse() with namespace import', () => {
    const code = `
      import * as url from 'node:url';
      const parsed = url.parse(req.url);
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should detect named import of parse from url', () => {
    const code = `
      import { parse } from 'url';
      const parsed = parse('https://example.com');
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should detect aliased named import', () => {
    const code = `
      import { parse as urlParse } from 'url';
      const parsed = urlParse('https://example.com');
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should allow new URL()', () => {
    const code = `
      const parsed = new URL('https://example.com');
      const withBase = new URL('/path', 'https://example.com');
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow url.format() and other url methods', () => {
    const code = `
      import url from 'url';
      const formatted = url.format({ protocol: 'https', hostname: 'example.com' });
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not flag parse() from non-url modules', () => {
    const code = `
      import { parse } from 'path';
      const result = parse('/foo/bar.txt');
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not flag URL.parse static method (modern WHATWG URL API)', () => {
    const code = `
      const result = URL.parse('https://example.com');
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
