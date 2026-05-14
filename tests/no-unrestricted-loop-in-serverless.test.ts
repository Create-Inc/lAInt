import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['no-unrestricted-loop-in-serverless'] };

describe('no-unrestricted-loop-in-serverless rule', () => {
  it('should detect while(true) without break', () => {
    const code = `
      async function handler(req) {
        while (true) {
          await fetchData();
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-unrestricted-loop-in-serverless');
    expect(results[0].message).toContain('timeout');
    expect(results[0].severity).toBe('error');
  });

  it('should detect for(;;) without break', () => {
    const code = `
      async function handler(req) {
        for (;;) {
          await poll();
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should detect while(1) without break', () => {
    const code = `
      function handler() {
        while (1) {
          doWork();
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should allow while(true) with break', () => {
    const code = `
      async function handler(req) {
        while (true) {
          const data = await fetchData();
          if (data.done) break;
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow while(true) with return', () => {
    const code = `
      async function handler(req) {
        while (true) {
          const data = await fetchData();
          if (data.done) return data;
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow bounded for loops', () => {
    const code = `
      function handler() {
        for (let i = 0; i < 100; i++) {
          doWork(i);
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow while with condition', () => {
    const code = `
      function handler() {
        let count = 0;
        while (count < 10) {
          doWork();
          count++;
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not count break inside nested loop as valid', () => {
    const code = `
      function handler() {
        while (true) {
          for (let i = 0; i < 10; i++) {
            if (i === 5) break;
          }
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should not count return inside nested function as valid', () => {
    const code = `
      function handler() {
        while (true) {
          const items = data.map((item) => {
            return item.name;
          });
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should allow while(false)', () => {
    const code = `
      function handler() {
        while (false) {
          doWork();
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
