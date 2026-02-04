import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['no-stylesheet-create'] };

describe('no-stylesheet-create rule', () => {
  it('should detect StyleSheet.create()', () => {
    const code = `
      const styles = StyleSheet.create({
        container: { flex: 1 }
      });
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-stylesheet-create');
    expect(results[0].message).toContain('inline styles');
    expect(results[0].severity).toBe('warning');
  });

  it('should allow inline styles', () => {
    const code = `
      function Component() {
        return <View style={{ flex: 1 }} />;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect multiple StyleSheet.create() calls', () => {
    const code = `
      const styles1 = StyleSheet.create({ a: {} });
      const styles2 = StyleSheet.create({ b: {} });
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(2);
  });

  it('should not flag other method calls', () => {
    const code = `
      const styles = OtherModule.create({});
      StyleSheet.flatten(styles);
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
