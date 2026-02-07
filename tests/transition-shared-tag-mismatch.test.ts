import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['transition-shared-tag-mismatch'] };

describe('transition-shared-tag-mismatch rule', () => {
  it('should warn when Pressable tag has no matching View', () => {
    const code = `
      function Screen() {
        return (
          <Transition.Pressable sharedBoundTag="hero-image">
            <Image source={img} />
          </Transition.Pressable>
        );
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('transition-shared-tag-mismatch');
    expect(results[0].message).toContain('hero-image');
    expect(results[0].message).toContain('Transition.Pressable');
    expect(results[0].message).toContain('no matching Transition.View');
    expect(results[0].severity).toBe('warning');
  });

  it('should warn when View tag has no matching Pressable', () => {
    const code = `
      function DetailScreen() {
        return (
          <Transition.View sharedBoundTag="hero-image">
            <Image source={img} />
          </Transition.View>
        );
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].message).toContain('Transition.View');
    expect(results[0].message).toContain('no matching Transition.Pressable');
  });

  it('should not warn when tags are matched', () => {
    const code = `
      function Screen() {
        return (
          <View>
            <Transition.Pressable sharedBoundTag="hero-image">
              <Image source={img} />
            </Transition.Pressable>
            <Transition.View sharedBoundTag="hero-image">
              <Image source={img} />
            </Transition.View>
          </View>
        );
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect multiple mismatched tags', () => {
    const code = `
      function Screen() {
        return (
          <View>
            <Transition.Pressable sharedBoundTag="tag-a">
              <Text>A</Text>
            </Transition.Pressable>
            <Transition.Pressable sharedBoundTag="tag-b">
              <Text>B</Text>
            </Transition.Pressable>
          </View>
        );
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(2);
  });

  it('should handle JSX expression container for tag values', () => {
    const code = `
      function Screen() {
        return (
          <Transition.Pressable sharedBoundTag={"dynamic-tag"}>
            <Text>Hello</Text>
          </Transition.Pressable>
        );
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].message).toContain('dynamic-tag');
  });

  it('should not flag non-Transition components', () => {
    const code = `
      function Screen() {
        return (
          <View sharedBoundTag="tag-a">
            <Text>Hello</Text>
          </View>
        );
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
