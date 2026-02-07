import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['transition-prefer-blank-stack'] };

describe('transition-prefer-blank-stack rule', () => {
  it('should warn when enableTransitions is true', () => {
    const code = `
      <Stack.Screen
        options={{
          enableTransitions: true,
        }}
      />
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('transition-prefer-blank-stack');
    expect(results[0].message).toContain('Blank Stack');
    expect(results[0].message).toContain('enableTransitions');
    expect(results[0].severity).toBe('warning');
  });

  it('should not warn when enableTransitions is false', () => {
    const code = `
      <Stack.Screen
        options={{
          enableTransitions: false,
        }}
      />
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not warn when enableTransitions is not present', () => {
    const code = `
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect enableTransitions in screenOptions', () => {
    const code = `
      <Stack
        screenOptions={{
          enableTransitions: true,
        }}
      />
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should not flag enableTransitions with variable value', () => {
    const code = `
      const options = {
        enableTransitions: someVariable,
      };
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
