import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['prefer-promise-all'] };

describe('prefer-promise-all rule', () => {
  it('should flag sequential await in for...of with bare await', () => {
    const code = `
      async function processAll(items) {
        for (const item of items) {
          await processItem(item);
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('prefer-promise-all');
    expect(results[0].message).toContain('Promise.all');
    expect(results[0].severity).toBe('warning');
  });

  it('should flag when result is added to a Set', () => {
    const code = `
      async function fetchAll(urls) {
        const results = new Set();
        for (const url of urls) {
          const data = await fetch(url);
          results.add(data);
        }
        return results;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should flag when result is stored in a Map', () => {
    const code = `
      async function fetchAll(items) {
        const cache = new Map();
        for (const item of items) {
          const result = await fetchItem(item.id);
          cache.set(item.id, result);
        }
        return cache;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should flag when await result is assigned to a local variable only', () => {
    const code = `
      async function processAll(items) {
        for (const item of items) {
          const result = await doWork(item);
          console.log(result);
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should NOT flag when result is pushed to an array', () => {
    const code = `
      async function fetchAll(urls) {
        const results = [];
        for (const url of urls) {
          const data = await fetch(url);
          results.push(data);
        }
        return results;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should NOT flag when loop has break', () => {
    const code = `
      async function findFirst(items) {
        for (const item of items) {
          const result = await check(item);
          if (result.found) break;
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should NOT flag when loop has return', () => {
    const code = `
      async function findFirst(items) {
        for (const item of items) {
          const result = await check(item);
          if (result.found) return result;
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should NOT flag cross-iteration dependency', () => {
    const code = `
      async function chain(items) {
        let prev = null;
        for (const item of items) {
          prev = await process(prev, item);
        }
        return prev;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should NOT flag cross-iteration accumulator', () => {
    const code = `
      async function sum(items) {
        let total = 0;
        for (const item of items) {
          const value = await getValue(item);
          total += value;
        }
        return total;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should NOT flag for await...of', () => {
    const code = `
      async function consume(stream) {
        for await (const chunk of stream) {
          await processChunk(chunk);
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should NOT flag loops without await', () => {
    const code = `
      function processAll(items) {
        for (const item of items) {
          processItem(item);
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should NOT flag when await is inside a nested function (e.g. .map callback)', () => {
    const code = `
      function processAll(items) {
        for (const group of groups) {
          const results = group.items.map(async (item) => {
            return await fetchItem(item);
          });
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should NOT flag break inside a switch statement (not targeting outer loop)', () => {
    const code = `
      async function processAll(items) {
        for (const item of items) {
          const result = await fetchItem(item);
          switch (result.type) {
            case 'a':
              handleA(result);
              break;
            default:
              handleDefault(result);
              break;
          }
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should NOT flag unshift to array', () => {
    const code = `
      async function fetchAll(urls) {
        const results = [];
        for (const url of urls) {
          const data = await fetch(url);
          results.unshift(data);
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  // Cross-iteration dependency via member-expression assignment.
  // Pre-fix this would false-positive because hasCrossIterationDependency only
  // looked at Identifier lefts. dx5v review on PR #57.
  it('should NOT flag cross-iteration dependency through member expression LHS', () => {
    const code = `
      async function chain(items) {
        const state = { prev: null };
        for (const item of items) {
          state.prev = await process(state.prev, item);
        }
        return state.prev;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should NOT flag cross-iteration dependency through nested member expression LHS', () => {
    const code = `
      async function chain(items) {
        const state = { meta: { prev: null } };
        for (const item of items) {
          state.meta.prev = await process(state.meta.prev, item);
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  // Cross-iteration dependency via object-pattern assignment (re-bind).
  // dx5v review on PR #57.
  it('should NOT flag cross-iteration dependency through object-pattern LHS', () => {
    const code = `
      async function chain(items) {
        let next = null;
        for (const item of items) {
          ({ next } = await process(next, item));
        }
        return next;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  // Cross-iteration dependency via aliased object-pattern (e.g. `{ a: x }`).
  it('should NOT flag cross-iteration dependency through aliased object-pattern LHS', () => {
    const code = `
      async function chain(items) {
        let prev = null;
        for (const item of items) {
          ({ next: prev } = await process(prev, item));
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  // Cross-iteration dependency via array-pattern assignment.
  it('should NOT flag cross-iteration dependency through array-pattern LHS', () => {
    const code = `
      async function chain(items) {
        let prev = null;
        let count = 0;
        for (const item of items) {
          [prev, count] = await process(prev, item);
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  // Member writes targeting a fresh object declared inside the loop should
  // still flag — the root binding is loop-local, not cross-iteration.
  it('should still flag member-expression assignment to a loop-local object', () => {
    const code = `
      async function processAll(items) {
        for (const item of items) {
          const local = {};
          local.value = await fetchItem(item);
        }
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });
});
