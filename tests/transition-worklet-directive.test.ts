import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['transition-worklet-directive'] };

describe('transition-worklet-directive rule', () => {
  it('should detect arrow function missing worklet directive', () => {
    const code = `
      const options = {
        screenStyleInterpolator: (progress) => {
          return { opacity: progress };
        },
      };
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('transition-worklet-directive');
    expect(results[0].message).toContain('"worklet" directive');
    expect(results[0].severity).toBe('error');
  });

  it('should detect function expression missing worklet directive', () => {
    const code = `
      const options = {
        screenStyleInterpolator: function(progress) {
          return { opacity: progress };
        },
      };
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('transition-worklet-directive');
    expect(results[0].severity).toBe('error');
  });

  it('should allow function with worklet directive', () => {
    const code = `
      const options = {
        screenStyleInterpolator: (progress) => {
          "worklet";
          return { opacity: progress };
        },
      };
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect arrow function with expression body (no block)', () => {
    const code = `
      const options = {
        screenStyleInterpolator: (progress) => ({ opacity: progress }),
      };
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].severity).toBe('error');
  });

  it('should not flag other properties', () => {
    const code = `
      const options = {
        onTransitionEnd: (progress) => {
          return { opacity: progress };
        },
      };
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not flag when value is not a function', () => {
    const code = `
      const options = {
        screenStyleInterpolator: myInterpolator,
      };
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
