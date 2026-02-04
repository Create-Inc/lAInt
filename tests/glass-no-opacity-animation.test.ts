import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['glass-no-opacity-animation'] };

describe('glass-no-opacity-animation rule', () => {
  it('should detect animated opacity variable on GlassView', () => {
    const code = `<GlassView style={{ opacity: fadeAnim }} />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('glass-no-opacity-animation');
    expect(results[0].message).toContain('opacity');
    expect(results[0].severity).toBe('warning');
  });

  it('should detect opacity interpolation on GlassView', () => {
    const code = `<GlassView style={{ opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }} />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should allow static opacity on GlassView', () => {
    const code = `<GlassView style={{ opacity: 0.8 }} />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow GlassView without opacity', () => {
    const code = `<GlassView style={{ padding: 10, borderRadius: 8 }} />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow opacity animation on regular View', () => {
    const code = `<View style={{ opacity: fadeAnim }} />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect in style array', () => {
    const code = `<GlassView style={[baseStyle, { opacity: animatedOpacity }]} />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });
});
