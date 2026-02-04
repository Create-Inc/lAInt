import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['no-border-width-on-glass'] };

describe('no-border-width-on-glass rule', () => {
  it('should detect borderWidth on GlassView', () => {
    const code = `
      <GlassView style={{ borderWidth: 1 }} />
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-border-width-on-glass');
    expect(results[0].message).toContain('borderRadius');
    expect(results[0].severity).toBe('error');
  });

  it('should detect borderTopWidth on GlassView', () => {
    const code = `
      <GlassView style={{ borderTopWidth: 1 }} />
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should detect borderBottomWidth on GlassView', () => {
    const code = `
      <GlassView style={{ borderBottomWidth: 2 }} />
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should detect borderLeftWidth on GlassView', () => {
    const code = `
      <GlassView style={{ borderLeftWidth: 1 }} />
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should detect borderRightWidth on GlassView', () => {
    const code = `
      <GlassView style={{ borderRightWidth: 1 }} />
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should detect borderWidth in style array', () => {
    const code = `
      <GlassView style={[baseStyle, { borderWidth: 1 }]} />
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should allow GlassView without borderWidth', () => {
    const code = `
      <GlassView style={{ borderRadius: 8, padding: 10 }} />
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow borderWidth on other components', () => {
    const code = `
      <View style={{ borderWidth: 1 }} />
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow borderColor on GlassView', () => {
    const code = `
      <GlassView style={{ borderColor: '#fff' }} />
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
