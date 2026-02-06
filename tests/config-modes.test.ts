import { describe, it, expect } from 'vitest';
import { lintJsxCode, getAllRuleNames } from '../src';

describe('config modes', () => {
  describe('include mode (default)', () => {
    it('should only run specified rules', () => {
      const code = `
        import { Image } from 'react-native';
        router.navigate('./profile');
      `;
      const results = lintJsxCode(code, {
        rules: ['no-relative-paths'],
      });

      expect(results).toHaveLength(1);
      expect(results[0].rule).toBe('no-relative-paths');
    });

    it('should run no rules when rules array is empty', () => {
      const code = `
        import { Image } from 'react-native';
        router.navigate('./profile');
      `;
      const results = lintJsxCode(code, {
        rules: [],
      });

      expect(results).toHaveLength(0);
    });

    it('should run multiple specified rules', () => {
      const code = `
        import { Image } from 'react-native';
        router.navigate('./profile');
      `;
      const results = lintJsxCode(code, {
        rules: ['no-relative-paths', 'expo-image-import'],
      });

      expect(results).toHaveLength(2);
      const ruleNames = results.map((r) => r.rule);
      expect(ruleNames).toContain('no-relative-paths');
      expect(ruleNames).toContain('expo-image-import');
    });
  });

  describe('exclude mode', () => {
    it('should run all rules except excluded ones', () => {
      const code = `
        import { Image } from 'react-native';
        router.navigate('./profile');
      `;
      // Exclude both rules that would match this code
      const results = lintJsxCode(code, {
        rules: ['no-relative-paths', 'expo-image-import'],
        exclude: true,
      });

      // Should not contain the excluded rules
      const ruleNames = results.map((r) => r.rule);
      expect(ruleNames).not.toContain('no-relative-paths');
      expect(ruleNames).not.toContain('expo-image-import');
    });

    it('should run all rules when exclude is true and rules array is empty', () => {
      const code = `
        import { Image } from 'react-native';
        router.navigate('./profile');
      `;
      const results = lintJsxCode(code, {
        rules: [],
        exclude: true,
      });

      // Should find issues from multiple rules
      const ruleNames = results.map((r) => r.rule);
      expect(ruleNames).toContain('no-relative-paths');
      expect(ruleNames).toContain('expo-image-import');
    });

    it('should allow a single rule when excluding all others', () => {
      const code = `router.navigate('./profile');`;
      const allRules = getAllRuleNames();
      const rulesToExclude = allRules.filter((r) => r !== 'no-relative-paths');

      const results = lintJsxCode(code, {
        rules: rulesToExclude,
        exclude: true,
      });

      expect(results).toHaveLength(1);
      expect(results[0].rule).toBe('no-relative-paths');
    });
  });

  describe('getAllRuleNames', () => {
    it('should return all available rule names', () => {
      const ruleNames = getAllRuleNames();

      expect(ruleNames).toContain('no-relative-paths');
      expect(ruleNames).toContain('expo-image-import');
      expect(ruleNames).toContain('no-stylesheet-create');
      expect(ruleNames.length).toBe(31);
    });
  });
});
