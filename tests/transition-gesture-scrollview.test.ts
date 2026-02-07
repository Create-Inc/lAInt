import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['transition-gesture-scrollview'] };

describe('transition-gesture-scrollview rule', () => {
  it('should warn about ScrollView when file imports from screen-transitions', () => {
    const code = `
      import { Transition } from 'react-native-screen-transitions';
      import { ScrollView } from 'react-native';

      function Screen() {
        return (
          <ScrollView>
            <Transition.View />
          </ScrollView>
        );
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('transition-gesture-scrollview');
    expect(results[0].message).toContain('Transition.ScrollView');
    expect(results[0].severity).toBe('warning');
  });

  it('should warn about FlatList when file imports from screen-transitions', () => {
    const code = `
      import { Transition } from 'react-native-screen-transitions';
      import { FlatList } from 'react-native';

      function Screen() {
        return (
          <FlatList data={items} renderItem={renderItem} />
        );
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].message).toContain('Transition.FlatList');
  });

  it('should not warn when no screen-transitions import', () => {
    const code = `
      import { ScrollView } from 'react-native';

      function Screen() {
        return (
          <ScrollView>
            <Text>Hello</Text>
          </ScrollView>
        );
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect both ScrollView and FlatList in the same file', () => {
    const code = `
      import { Transition } from 'react-native-screen-transitions';
      import { ScrollView, FlatList } from 'react-native';

      function Screen() {
        return (
          <View>
            <ScrollView />
            <FlatList data={[]} renderItem={() => null} />
          </View>
        );
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(2);
  });

  it('should not flag Transition.ScrollView usage', () => {
    const code = `
      import { Transition } from 'react-native-screen-transitions';

      function Screen() {
        return (
          <Transition.ScrollView>
            <Transition.View />
          </Transition.ScrollView>
        );
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
