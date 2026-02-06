import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['transition-progress-range'] };

describe('transition-progress-range rule', () => {
  it('should warn when interpolate only covers [0, 1]', () => {
    const code = `
      const options = {
        screenStyleInterpolator: (progress) => {
          "worklet";
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          return { opacity };
        },
      };
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('transition-progress-range');
    expect(results[0].message).toContain('[0, 1, 2]');
    expect(results[0].message).toContain('exit phase');
    expect(results[0].severity).toBe('warning');
  });

  it('should allow interpolate covering [0, 1, 2]', () => {
    const code = `
      const options = {
        screenStyleInterpolator: (progress) => {
          "worklet";
          const opacity = interpolate(progress, [0, 1, 2], [0, 1, 0]);
          return { opacity };
        },
      };
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not flag interpolate outside screenStyleInterpolator', () => {
    const code = `
      function animate(progress) {
        const opacity = interpolate(progress, [0, 1], [0, 1]);
        return { opacity };
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect multiple incomplete interpolate calls', () => {
    const code = `
      const options = {
        screenStyleInterpolator: (progress) => {
          "worklet";
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          const translateX = interpolate(progress, [0, 1], [300, 0]);
          return { opacity, transform: [{ translateX }] };
        },
      };
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(2);
  });

  it('should not flag when input range has max value above 1', () => {
    const code = `
      const options = {
        screenStyleInterpolator: (progress) => {
          "worklet";
          const opacity = interpolate(progress, [0, 0.5, 2], [0, 1, 0]);
          return { opacity };
        },
      };
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
