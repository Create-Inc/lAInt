import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['native-tabs-bottom-padding'] };

describe('native-tabs-bottom-padding rule', () => {
  it('should warn when NativeTabs is used', () => {
    const code = `
      import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

      export default function TabLayout() {
        return (
          <NativeTabs>
            <NativeTabs.Trigger name='index'>
              <Label>Home</Label>
            </NativeTabs.Trigger>
          </NativeTabs>
        );
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('native-tabs-bottom-padding');
    expect(results[0].message).toContain('64px');
    expect(results[0].severity).toBe('warning');
  });

  it('should not warn without NativeTabs import', () => {
    const code = `
      import { Tabs } from 'expo-router';

      export default function TabLayout() {
        return (
          <Tabs>
            <Tabs.Screen name="home" />
          </Tabs>
        );
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should not warn if NativeTabs is imported but not used', () => {
    const code = `
      import { NativeTabs } from 'expo-router/unstable-native-tabs';

      export default function TabLayout() {
        return <View />;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
