import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['header-shown-false'] };

describe('header-shown-false rule', () => {
  it('should detect (tabs) Screen without headerShown: false', () => {
    const code = `
      <Stack>
        <Stack.Screen name="(tabs)" />
      </Stack>
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('header-shown-false');
    expect(results[0].message).toContain('headerShown: false');
    expect(results[0].severity).toBe('warning');
  });

  it('should detect (tabs) Screen with options but no headerShown', () => {
    const code = `
      <Stack>
        <Stack.Screen name="(tabs)" options={{ title: 'Home' }} />
      </Stack>
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should allow (tabs) Screen with headerShown: false', () => {
    const code = `
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not flag other screens', () => {
    const code = `
      <Stack>
        <Stack.Screen name="home" />
        <Stack.Screen name="profile" />
      </Stack>
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should handle Tabs.Screen as well', () => {
    const code = `
      <Tabs>
        <Tabs.Screen name="(tabs)" />
      </Tabs>
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });
});
