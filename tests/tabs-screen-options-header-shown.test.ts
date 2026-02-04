import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['tabs-screen-options-header-shown'] };

describe('tabs-screen-options-header-shown rule', () => {
  it('should detect Tabs without headerShown: false in screenOptions', () => {
    const code = `
      <Tabs
        screenOptions={{
          tabBarStyle: { backgroundColor: '#fff' },
        }}
      >
        <Tabs.Screen name="home" />
      </Tabs>
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('tabs-screen-options-header-shown');
    expect(results[0].message).toContain('headerShown: false');
    expect(results[0].severity).toBe('warning');
  });

  it('should allow Tabs with headerShown: false', () => {
    const code = `
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: '#fff' },
        }}
      >
        <Tabs.Screen name="home" />
      </Tabs>
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect headerShown: true as violation', () => {
    const code = `
      <Tabs
        screenOptions={{
          headerShown: true,
        }}
      >
        <Tabs.Screen name="home" />
      </Tabs>
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should not flag other components', () => {
    const code = `
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="home" />
      </Stack>
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not flag Tabs without screenOptions', () => {
    const code = `
      <Tabs>
        <Tabs.Screen name="home" />
      </Tabs>
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
