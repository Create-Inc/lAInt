import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['no-safeareaview'] };

describe('no-safeareaview rule', () => {
  it('should detect SafeAreaView usage', () => {
    const code = `
      function Component() {
        return <SafeAreaView><Text>Hello</Text></SafeAreaView>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-safeareaview');
    expect(results[0].message).toContain('useSafeAreaInsets');
    expect(results[0].severity).toBe('warning');
  });

  it('should allow View with useSafeAreaInsets', () => {
    const code = `
      function Component() {
        const insets = useSafeAreaInsets();
        return <View style={{ paddingTop: insets.top }}><Text>Hello</Text></View>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect self-closing SafeAreaView', () => {
    const code = `<SafeAreaView />`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should not flag other components', () => {
    const code = `<View><Text>Hello</Text></View>`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
