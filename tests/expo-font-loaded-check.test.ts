import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['expo-font-loaded-check'] };

describe('expo-font-loaded-check rule', () => {
  it('should detect useFonts without loaded check', () => {
    const code = `
      function Component() {
        const [loaded, error] = useFonts({ Inter_400Regular });
        return <Text style={{ fontFamily: 'Inter_400Regular' }}>Hello</Text>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('expo-font-loaded-check');
    expect(results[0].message).toContain('loaded');
    expect(results[0].severity).toBe('error');
  });

  it('should allow useFonts with loaded check', () => {
    const code = `
      function Component() {
        const [loaded, error] = useFonts({ Inter_400Regular });
        if (!loaded && !error) {
          return null;
        }
        return <Text style={{ fontFamily: 'Inter_400Regular' }}>Hello</Text>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow useFonts with just loaded check', () => {
    const code = `
      function Component() {
        const [loaded] = useFonts({ Inter_400Regular });
        if (!loaded) return null;
        return <Text>Hello</Text>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow code without useFonts', () => {
    const code = `
      function Component() {
        return <Text>Hello</Text>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect useFonts with incorrect check', () => {
    const code = `
      function Component() {
        const [loaded] = useFonts({ Inter_400Regular });
        if (someOtherCondition) return null;
        return <Text>Hello</Text>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });
});
