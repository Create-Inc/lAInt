import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['scrollview-horizontal-flexgrow'] };

describe('scrollview-horizontal-flexgrow rule', () => {
  it('should detect horizontal ScrollView without flexGrow: 0', () => {
    const code = `<ScrollView horizontal />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('scrollview-horizontal-flexgrow');
    expect(results[0].message).toContain('flexGrow: 0');
    expect(results[0].severity).toBe('warning');
  });

  it('should detect horizontal={true} without flexGrow: 0', () => {
    const code = `<ScrollView horizontal={true} />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should allow horizontal ScrollView with flexGrow: 0', () => {
    const code = `<ScrollView horizontal style={{ flexGrow: 0 }} />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow vertical ScrollView without flexGrow: 0', () => {
    const code = `<ScrollView />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not flag horizontal={false}', () => {
    const code = `<ScrollView horizontal={false} />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow other components with horizontal prop', () => {
    const code = `<FlatList horizontal />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
