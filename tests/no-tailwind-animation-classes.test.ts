import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['no-tailwind-animation-classes'] };

describe('no-tailwind-animation-classes rule', () => {
  it('should detect animate-spin class', () => {
    const code = `<div className="animate-spin" />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-tailwind-animation-classes');
    expect(results[0].message).toContain('style jsx global');
    expect(results[0].severity).toBe('warning');
  });

  it('should detect animate-pulse class', () => {
    const code = `<div className="flex animate-pulse items-center" />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should detect animate-bounce class', () => {
    const code = `<button className="animate-bounce" />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should detect in template literal', () => {
    const code = "<div className={`flex animate-ping`} />";
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should allow non-animation tailwind classes', () => {
    const code = `<div className="flex items-center justify-between p-4" />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow transition classes', () => {
    const code = `<div className="transition-all duration-300" />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect multiple animation classes', () => {
    const code = `
      <>
        <div className="animate-spin" />
        <div className="animate-pulse" />
      </>
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(2);
  });
});
