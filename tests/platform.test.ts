import { describe, it, expect } from 'vitest';
import { getRulesForPlatform, getAllRuleNames, getRuleMeta, lintJsxCode } from '../src';

describe('getRulesForPlatform', () => {
  const allRules = getAllRuleNames();

  it('expo includes expo-tagged and universal rules', () => {
    const expoRules = getRulesForPlatform('expo');

    // Expo-specific rules present
    expect(expoRules).toContain('no-stylesheet-create');
    expect(expoRules).toContain('expo-image-import');
    expect(expoRules).toContain('transition-worklet-directive');

    // Universal rules present
    expect(expoRules).toContain('prefer-guard-clauses');
    expect(expoRules).toContain('no-type-assertion');

    // Shared expo+web rules present
    expect(expoRules).toContain('no-relative-paths');
    expect(expoRules).toContain('no-class-components');

    // Backend-only rules excluded
    expect(expoRules).not.toContain('no-require-statements');
    expect(expoRules).not.toContain('sql-no-nested-calls');

    // Web-only rules excluded
    expect(expoRules).not.toContain('no-inline-script-code');
    expect(expoRules).not.toContain('browser-api-in-useeffect');
  });

  it('web includes web-tagged and universal rules', () => {
    const webRules = getRulesForPlatform('web');

    // Web-specific rules present
    expect(webRules).toContain('no-inline-script-code');
    expect(webRules).toContain('browser-api-in-useeffect');
    expect(webRules).toContain('no-tailwind-animation-classes');

    // Shared web+backend rules present
    expect(webRules).toContain('fetch-response-ok-check');

    // Universal rules present
    expect(webRules).toContain('prefer-guard-clauses');
    expect(webRules).toContain('no-type-assertion');

    // Shared expo+web rules present
    expect(webRules).toContain('no-relative-paths');

    // Expo-only rules excluded
    expect(webRules).not.toContain('no-stylesheet-create');
    expect(webRules).not.toContain('expo-image-import');

    // Backend-only rules excluded
    expect(webRules).not.toContain('sql-no-nested-calls');
  });

  it('backend includes backend-tagged and universal rules', () => {
    const backendRules = getRulesForPlatform('backend');

    // Backend-specific rules present
    expect(backendRules).toContain('no-require-statements');
    expect(backendRules).toContain('no-response-json-lowercase');
    expect(backendRules).toContain('sql-no-nested-calls');

    // Shared web+backend rules present
    expect(backendRules).toContain('fetch-response-ok-check');

    // Universal rules present
    expect(backendRules).toContain('prefer-guard-clauses');
    expect(backendRules).toContain('no-type-assertion');

    // Expo-only rules excluded
    expect(backendRules).not.toContain('no-stylesheet-create');
    expect(backendRules).not.toContain('expo-image-import');

    // Web-only rules excluded
    expect(backendRules).not.toContain('no-inline-script-code');
    expect(backendRules).not.toContain('browser-api-in-useeffect');
  });

  it('universal rules appear in all three platforms', () => {
    const expoRules = new Set(getRulesForPlatform('expo'));
    const webRules = new Set(getRulesForPlatform('web'));
    const backendRules = new Set(getRulesForPlatform('backend'));

    const universalRules = allRules.filter((name) => !getRuleMeta(name)?.platforms);
    expect(universalRules.length).toBeGreaterThan(0);

    for (const rule of universalRules) {
      expect(expoRules.has(rule)).toBe(true);
      expect(webRules.has(rule)).toBe(true);
      expect(backendRules.has(rule)).toBe(true);
    }
  });

  it('every rule is reachable by at least one platform', () => {
    const expoRules = new Set(getRulesForPlatform('expo'));
    const webRules = new Set(getRulesForPlatform('web'));
    const backendRules = new Set(getRulesForPlatform('backend'));

    for (const rule of allRules) {
      const reachable = expoRules.has(rule) || webRules.has(rule) || backendRules.has(rule);
      expect(reachable).toBe(true);
    }
  });
});

describe('lintJsxCode with platform config', () => {
  it('platform: backend does not run expo rules', () => {
    const code = `
      import { Image } from 'react-native';
      router.navigate('./profile');
    `;
    const results = lintJsxCode(code, {
      rules: [],
      platform: 'backend',
    });

    const ruleNames = results.map((r) => r.rule);
    // expo-image-import and no-relative-paths are not backend rules
    expect(ruleNames).not.toContain('expo-image-import');
    expect(ruleNames).not.toContain('no-relative-paths');
  });

  it('platform: expo runs expo rules on matching code', () => {
    const code = `
      import { Image } from 'react-native';
      router.navigate('./profile');
    `;
    const results = lintJsxCode(code, {
      rules: [],
      platform: 'expo',
    });

    const ruleNames = results.map((r) => r.rule);
    expect(ruleNames).toContain('expo-image-import');
    expect(ruleNames).toContain('no-relative-paths');
  });

  it('platform takes precedence over rules/exclude', () => {
    const code = `
      import { Image } from 'react-native';
    `;
    // Even though rules lists no-relative-paths, platform: backend should take precedence
    const results = lintJsxCode(code, {
      rules: ['expo-image-import'],
      platform: 'backend',
    });

    const ruleNames = results.map((r) => r.rule);
    expect(ruleNames).not.toContain('expo-image-import');
  });
});
