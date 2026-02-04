import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['expo-image-import'] };

describe('expo-image-import rule', () => {
  it('should detect Image import from react-native', () => {
    const code = `import { Image } from 'react-native';`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('expo-image-import');
    expect(results[0].message).toContain('expo-image');
    expect(results[0].severity).toBe('warning');
  });

  it('should detect Image among multiple imports', () => {
    const code = `import { View, Image, Text } from 'react-native';`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should allow Image from expo-image', () => {
    const code = `import { Image } from 'expo-image';`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow other react-native imports', () => {
    const code = `import { View, Text, StyleSheet } from 'react-native';`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow ImageBackground from react-native', () => {
    const code = `import { ImageBackground } from 'react-native';`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should handle renamed imports correctly', () => {
    const code = `import { Image as RNImage } from 'react-native';`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });
});
