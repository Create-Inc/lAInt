import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['glass-needs-fallback'] };

describe('glass-needs-fallback rule', () => {
  it('should detect GlassView without isLiquidGlassAvailable check', () => {
    const code = `
      function Component() {
        return <GlassView style={{ padding: 10 }}>Content</GlassView>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('glass-needs-fallback');
    expect(results[0].message).toContain('isLiquidGlassAvailable');
    expect(results[0].severity).toBe('warning');
  });

  it('should allow GlassView with isLiquidGlassAvailable check', () => {
    const code = `
      function Component() {
        const CustomView = isLiquidGlassAvailable() ? GlassView : View;
        return <CustomView style={{ padding: 10 }}>Content</CustomView>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow code without GlassView', () => {
    const code = `
      function Component() {
        return <View style={{ padding: 10 }}>Content</View>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect multiple GlassViews without check', () => {
    const code = `
      function Component() {
        return (
          <View>
            <GlassView>One</GlassView>
            <GlassView>Two</GlassView>
          </View>
        );
      }
    `;
    const results = lintJsxCode(code, config);
    // Should only report once per file
    expect(results).toHaveLength(1);
  });
});
