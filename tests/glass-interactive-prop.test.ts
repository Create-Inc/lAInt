import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['glass-interactive-prop'] };

describe('glass-interactive-prop rule', () => {
  it('should detect GlassView inside TouchableOpacity without isInteractive', () => {
    const code = `
      <TouchableOpacity>
        <GlassView style={{ padding: 10 }}>Press me</GlassView>
      </TouchableOpacity>
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('glass-interactive-prop');
    expect(results[0].message).toContain('isInteractive={true}');
    expect(results[0].severity).toBe('warning');
  });

  it('should detect GlassView inside Pressable without isInteractive', () => {
    const code = `
      <Pressable onPress={handlePress}>
        <GlassView>Press me</GlassView>
      </Pressable>
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should allow GlassView with isInteractive={true}', () => {
    const code = `
      <TouchableOpacity>
        <GlassView isInteractive={true}>Press me</GlassView>
      </TouchableOpacity>
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow GlassView with isInteractive (shorthand)', () => {
    const code = `
      <Pressable>
        <GlassView isInteractive>Press me</GlassView>
      </Pressable>
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow GlassView outside of pressable components', () => {
    const code = `
      <View>
        <GlassView>Not pressable</GlassView>
      </View>
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect in TouchableHighlight', () => {
    const code = `
      <TouchableHighlight>
        <GlassView>Press</GlassView>
      </TouchableHighlight>
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });
});
