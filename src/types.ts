import type { File } from '@babel/types';

export type Platform = 'expo' | 'web' | 'backend';

export interface LintResult {
  rule: string;
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
}

export interface LintConfig {
  /**
   * List of rule names.
   * - When `exclude` is false/undefined: only these rules are enabled (include mode)
   * - When `exclude` is true: all rules are enabled except these (exclude mode)
   */
  rules?: string[];
  /**
   * When true, enables all rules except those listed in `rules`.
   * When false/undefined, only rules listed in `rules` are enabled.
   * @default false
   */
  exclude?: boolean;
  /**
   * When set, runs all rules tagged for this platform plus universal rules.
   * Takes precedence over `rules` and `exclude`.
   */
  platform?: Platform;
}

export type RuleFunction = (ast: File, code: string) => LintResult[];

export interface RuleMeta {
  name: string;
  severity: 'error' | 'warning';
  platforms: Platform[] | null;
  category: string;
  description: string;
}
