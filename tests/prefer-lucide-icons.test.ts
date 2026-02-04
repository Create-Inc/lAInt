import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['prefer-lucide-icons'] };

describe('prefer-lucide-icons rule', () => {
  it('should detect @expo/vector-icons import', () => {
    const code = `import { Ionicons } from '@expo/vector-icons';`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('prefer-lucide-icons');
    expect(results[0].message).toContain('lucide-react');
    expect(results[0].severity).toBe('warning');
  });

  it('should detect react-native-vector-icons import', () => {
    const code = `import Icon from 'react-native-vector-icons/FontAwesome';`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should detect react-icons import', () => {
    const code = `import { FaBeer } from 'react-icons/fa';`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should allow lucide-react import', () => {
    const code = `import { Home, Settings } from 'lucide-react';`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow lucide-react-native import', () => {
    const code = `import { Home, Settings } from 'lucide-react-native';`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow other imports', () => {
    const code = `import React from 'react';`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
