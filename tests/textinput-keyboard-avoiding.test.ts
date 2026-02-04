import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['textinput-keyboard-avoiding'] };

describe('textinput-keyboard-avoiding rule', () => {
  it('should detect TextInput without KeyboardAvoidingView', () => {
    const code = `
      function Screen() {
        return (
          <View>
            <TextInput placeholder="Enter text" />
          </View>
        );
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('textinput-keyboard-avoiding');
    expect(results[0].message).toContain('KeyboardAvoiding');
    expect(results[0].severity).toBe('warning');
  });

  it('should allow TextInput with KeyboardAvoidingAnimatedView', () => {
    const code = `
      import KeyboardAvoidingAnimatedView from '@/components/KeyboardAvoidingAnimatedView';

      function Screen() {
        return (
          <KeyboardAvoidingAnimatedView>
            <TextInput placeholder="Enter text" />
          </KeyboardAvoidingAnimatedView>
        );
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow TextInput with KeyboardAvoidingView', () => {
    const code = `
      import { KeyboardAvoidingView } from 'react-native';

      function Screen() {
        return (
          <KeyboardAvoidingView>
            <TextInput placeholder="Enter text" />
          </KeyboardAvoidingView>
        );
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not warn when there is no TextInput', () => {
    const code = `
      function Screen() {
        return (
          <View>
            <Text>Hello</Text>
          </View>
        );
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect multiple TextInputs without wrapper', () => {
    const code = `
      function Screen() {
        return (
          <View>
            <TextInput placeholder="Name" />
            <TextInput placeholder="Email" />
          </View>
        );
      }
    `;
    const results = lintJsxCode(code, config);
    // Should only report once per file
    expect(results).toHaveLength(1);
  });
});
