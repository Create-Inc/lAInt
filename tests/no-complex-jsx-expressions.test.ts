import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['no-complex-jsx-expressions'] };

describe('no-complex-jsx-expressions rule', () => {
  it('should detect IIFE in JSX', () => {
    const code = `<div>{(() => { const x = 1; return x; })()}</div>`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-complex-jsx-expressions');
    expect(results[0].severity).toBe('warning');
  });

  it('should allow simple variables', () => {
    const code = `<div>{userName}</div>`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow simple member expressions', () => {
    const code = `<div>{user.name}</div>`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow simple function calls', () => {
    const code = `<div>{formatDate(date)}</div>`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow arrow function event handlers', () => {
    const code = `<button onClick={() => setCount(count + 1)}>Click</button>`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow conditional rendering with && ', () => {
    const code = `<div>{isLoggedIn && <UserProfile />}</div>`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow simple ternary with JSX', () => {
    const code = `<div>{isLoading ? <Spinner /> : <Content />}</div>`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow ternary with null', () => {
    const code = `<div>{error ? <Error message={error} /> : null}</div>`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow template literals', () => {
    const code = '<div>{`Hello, ${name}!`}</div>';
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow string/number literals', () => {
    const code = `<div>{"Hello"}</div>`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
