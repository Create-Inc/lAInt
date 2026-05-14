import { parseJsx } from './parser';
import { rules, ruleMeta } from './rules';
import type { LintConfig, LintResult, Platform, RuleMeta } from './types';

export type { LintConfig, LintResult, RuleFunction, Platform, RuleMeta } from './types';

/**
 * Get all available rule names
 */
export function getAllRuleNames(): string[] {
  return Object.keys(rules);
}

/**
 * Get the metadata for a rule, or undefined if the rule does not exist.
 */
export function getRuleMeta(name: string): RuleMeta | undefined {
  return ruleMeta[name];
}

/**
 * Get rule names applicable to a platform.
 * Returns platform-tagged rules + universal rules (those without a platform tag).
 */
export function getRulesForPlatform(platform: Platform): string[] {
  return Object.keys(rules).filter((name) => {
    const platforms = ruleMeta[name]?.platforms;
    // null/missing platforms = universal, always included
    if (!platforms) return true;
    return platforms.includes(platform);
  });
}

export function lintJsxCode(code: string, config: LintConfig): LintResult[] {
  const ast = parseJsx(code);
  const results: LintResult[] = [];

  let rulesToRun: string[];

  if (config.platform) {
    rulesToRun = getRulesForPlatform(config.platform);
  } else if (config.exclude) {
    const excludeSet = new Set(config.rules ?? []);
    rulesToRun = Object.keys(rules).filter((name) => !excludeSet.has(name));
  } else {
    rulesToRun = config.rules ?? [];
  }

  for (const ruleName of rulesToRun) {
    const ruleFunc = rules[ruleName];
    if (ruleFunc) {
      const ruleResults = ruleFunc(ast, code);
      results.push(...ruleResults);
    } else {
      console.warn(`Unknown rule: ${ruleName}`);
    }
  }

  return results;
}
