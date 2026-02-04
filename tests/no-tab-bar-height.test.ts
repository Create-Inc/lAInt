import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['no-tab-bar-height'] };

describe('no-tab-bar-height rule', () => {
  it('should detect height in tabBarStyle within screenOptions', () => {
    const code = `
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#fff',
            height: 60,
          },
        }}
      />
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-tab-bar-height');
    expect(results[0].message).toContain('Never set height');
    expect(results[0].severity).toBe('error');
  });

  it('should detect height in tabBarStyle within options', () => {
    const code = `
      <Tabs.Screen
        options={{
          tabBarStyle: {
            height: 50,
          },
        }}
      />
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should allow tabBarStyle without height', () => {
    const code = `
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            paddingTop: 4,
          },
        }}
      />
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow other style properties', () => {
    const code = `
      <Tabs
        screenOptions={{
          headerStyle: {
            height: 100,
          },
        }}
      />
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow height in non-tab components', () => {
    const code = `
      <View style={{ height: 100 }} />
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
