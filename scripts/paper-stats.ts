import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { ruleMeta } from '../src/rules/index';

const PAPER_CATEGORY_ORDER = [
  'Code Style',
  'React Native / Expo',
  'React / JSX',
  'Next.js',
  'Backend / SQL',
  'Screen Transitions',
  'Liquid Glass',
  'Expo Router',
  'Tailwind CSS',
  'Error Handling',
  'General',
  'URL',
];

function parseArgs() {
  const args = process.argv.slice(2);
  const options: {
    evalPath: string | null;
    latexOut: string | null;
    repairEvalPath: string | null;
    repairLatexOut: string | null;
  } = {
    evalPath: null,
    latexOut: null,
    repairEvalPath: null,
    repairLatexOut: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === '--eval' && next) {
      options.evalPath = next;
      index += 1;
    } else if (arg === '--latex-out' && next) {
      options.latexOut = next;
      index += 1;
    } else if (arg === '--repair-eval' && next) {
      options.repairEvalPath = next;
      index += 1;
    } else if (arg === '--repair-latex-out' && next) {
      options.repairLatexOut = next;
      index += 1;
    } else if (arg === '--help') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg ?? ''}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage: npm run paper:stats -- [options]

Options:
  --eval <path>   Include prompt-grid stats from a results.json artifact.
  --latex-out <path>
                  Write generated LaTeX tables for the prompt-grid artifact.
  --repair-eval <path>
                  Include repair-loop stats from a results.json artifact.
  --repair-latex-out <path>
                  Write generated LaTeX tables for the repair-loop artifact.

Examples:
  npm run paper:stats
  npm run paper:stats -- --eval paper/eval/artifacts/initial-grid/results.json
  npm run paper:stats -- --eval paper/eval/artifacts/full-grid-2026-05-17/results.json --latex-out paper/generated/full-grid-tables.tex --repair-eval paper/eval/artifacts/repair-loop-2026-05-27/results.json --repair-latex-out paper/generated/repair-loop-tables.tex
`);
}

function countBy<T>(items: T[], keyOf: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyOf(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function orderedCategoryCounts(categoryCounts: Map<string, number>) {
  const seen = new Set<string>();
  const rows: Array<[string, number]> = [];

  for (const category of PAPER_CATEGORY_ORDER) {
    const count = categoryCounts.get(category);
    if (count !== undefined) {
      rows.push([category, count]);
      seen.add(category);
    }
  }

  for (const [category, count] of [...categoryCounts.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    if (!seen.has(category)) {
      rows.push([category, count]);
    }
  }

  return rows;
}

function printRuleStats() {
  const metas = Object.values(ruleMeta);
  const testFiles = readdirSync('tests').filter((file) => file.endsWith('.test.ts'));
  const severityCounts = countBy(metas, (meta) => meta.severity);
  const categoryRows = orderedCategoryCounts(countBy(metas, (meta) => meta.category));
  const universalRules = metas.filter(
    (meta) => meta.platforms === null || meta.platforms.length === 0,
  ).length;
  const platformTaggedRules = metas.length - universalRules;

  console.log('# Paper Stats');
  console.log('');
  console.log('## Rule Corpus');
  console.log('');
  console.log(`- Rules: ${metas.length}`);
  console.log(`- Test files: ${testFiles.length}`);
  console.log(`- Error-level rules: ${severityCounts.get('error') ?? 0}`);
  console.log(`- Warning-level rules: ${severityCounts.get('warning') ?? 0}`);
  console.log(`- Universal rules: ${universalRules}`);
  console.log(`- Platform-tagged rules: ${platformTaggedRules}`);
  console.log('');
  console.log('### Category Counts');
  console.log('');
  for (const [category, count] of categoryRows) {
    console.log(`- ${category}: ${count}`);
  }
  console.log('');
  console.log('### LaTeX Table Rows');
  console.log('');
  console.log('```tex');
  for (const [category, count] of categoryRows) {
    console.log(`    ${category} & ${count} \\\\`);
  }
  console.log('```');
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function getArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function getBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : Boolean(value);
}

type RunStats = {
  gridSlots: number;
  completedGenerations: number;
  lintedRuns: number;
  parseErrors: number;
  generationErrors: number;
  findings: number;
  platform: string | null;
};

type MatrixCell = {
  findings: number;
  parseError: boolean;
  generationError: boolean;
};

function emptyRunStats(platform: string | null): RunStats {
  return {
    gridSlots: 0,
    completedGenerations: 0,
    lintedRuns: 0,
    parseErrors: 0,
    generationErrors: 0,
    findings: 0,
    platform,
  };
}

function addRecordStats({
  stats,
  findings,
  parseError,
  generationError,
}: {
  stats: RunStats;
  findings: number;
  parseError: boolean;
  generationError: boolean;
}) {
  stats.gridSlots += 1;
  stats.findings += findings;
  if (parseError) {
    stats.parseErrors += 1;
  }
  if (generationError) {
    stats.generationErrors += 1;
    return;
  }
  stats.completedGenerations += 1;
  if (!parseError) {
    stats.lintedRuns += 1;
  }
}

function rememberOrderedValue({
  values,
  seen,
  value,
}: {
  values: string[];
  seen: Set<string>;
  value: string;
}) {
  if (seen.has(value)) {
    return;
  }
  values.push(value);
  seen.add(value);
}

function summarizeEvalArtifact(evalPath: string) {
  const parsed: unknown = JSON.parse(readFileSync(evalPath, 'utf8'));
  if (!isObject(parsed)) {
    throw new Error(`${evalPath}: expected object`);
  }

  const records = getArray(parsed.records);
  const promptIds = new Set<string>();
  const modelAliases = new Set<string>();
  const byRule = new Map<string, number>();
  const byModel = new Map<string, number>();
  const byModelStats = new Map<string, RunStats>();
  const byPromptStats = new Map<string, RunStats>();
  const promptOrder: string[] = [];
  const modelOrder: string[] = [];
  const seenPrompts = new Set<string>();
  const seenModels = new Set<string>();
  const matrix = new Map<string, Map<string, MatrixCell>>();
  let totalFindings = 0;
  let parseErrors = 0;
  let generationErrors = 0;

  for (const record of records) {
    if (!isObject(record)) {
      continue;
    }

    const prompt = isObject(record.prompt) ? record.prompt : {};
    const model = isObject(record.model) ? record.model : {};
    const promptId = getString(prompt.id) ?? 'unknown-prompt';
    const promptPlatform = getString(prompt.platform);
    const modelAlias = getString(model.alias) ?? 'unknown-model';
    const lintResults = getArray(record.lintResults);
    const parseError = getBoolean(record.parseError);
    const generationError = getBoolean(record.generationError);

    promptIds.add(promptId);
    rememberOrderedValue({ values: promptOrder, seen: seenPrompts, value: promptId });
    modelAliases.add(modelAlias);
    rememberOrderedValue({ values: modelOrder, seen: seenModels, value: modelAlias });
    byModel.set(modelAlias, (byModel.get(modelAlias) ?? 0) + lintResults.length);

    const modelStats = byModelStats.get(modelAlias) ?? emptyRunStats(null);
    byModelStats.set(modelAlias, modelStats);
    addRecordStats({
      stats: modelStats,
      findings: lintResults.length,
      parseError,
      generationError,
    });

    const promptStats = byPromptStats.get(promptId) ?? emptyRunStats(promptPlatform);
    byPromptStats.set(promptId, promptStats);
    addRecordStats({
      stats: promptStats,
      findings: lintResults.length,
      parseError,
      generationError,
    });

    const promptCells = matrix.get(promptId) ?? new Map<string, MatrixCell>();
    matrix.set(promptId, promptCells);
    promptCells.set(modelAlias, {
      findings: lintResults.length,
      parseError,
      generationError,
    });

    if (parseError) {
      parseErrors += 1;
    }
    if (generationError) {
      generationErrors += 1;
    }

    totalFindings += lintResults.length;

    for (const result of lintResults) {
      if (!isObject(result)) {
        continue;
      }
      const rule = getString(result.rule);
      if (rule) {
        byRule.set(rule, (byRule.get(rule) ?? 0) + 1);
      }
    }
  }

  return {
    name: basename(evalPath),
    prompts: promptIds.size,
    models: modelAliases.size,
    gridSlots: records.length,
    completedGenerations: records.filter((record) => isObject(record) && !record.generationError)
      .length,
    parseErrors,
    generationErrors,
    totalFindings,
    byRule: [...byRule.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    byModel: [...byModel.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    byModelStats: [...byModelStats.entries()].sort(
      (a, b) => b[1].findings - a[1].findings || a[0].localeCompare(b[0]),
    ),
    byPromptStats: [...byPromptStats.entries()].sort(
      (a, b) => b[1].findings - a[1].findings || a[0].localeCompare(b[0]),
    ),
    promptOrder,
    modelOrder,
    matrix,
  };
}

function latexEscape(value: string) {
  return value.replace(/[&%$#_{}~^\\]/g, (char) => {
    switch (char) {
      case '&':
        return '\\&';
      case '%':
        return '\\%';
      case '$':
        return '\\$';
      case '#':
        return '\\#';
      case '_':
        return '\\_';
      case '{':
        return '\\{';
      case '}':
        return '\\}';
      case '~':
        return '\\textasciitilde{}';
      case '^':
        return '\\textasciicircum{}';
      case '\\':
        return '\\textbackslash{}';
      default:
        return char;
    }
  });
}

function latexTexttt(value: string) {
  return `\\texttt{${latexEscape(value)}}`;
}

function formatPercent(count: number, total: number) {
  if (total === 0) {
    return '$--$';
  }
  return `${((count / total) * 100).toFixed(1)}\\%`;
}

function formatRate(count: number, denominator: number) {
  if (denominator === 0) {
    return '$--$';
  }
  return (count / denominator).toFixed(1);
}

function displayModelAlias(alias: string) {
  switch (alias) {
    case 'openai-gpt-5.5':
      return 'GPT-5.5';
    case 'openai-gpt-5.4':
      return 'GPT-5.4';
    case 'anthropic-sonnet-4.6':
      return 'Sonnet 4.6';
    case 'anthropic-opus-4.6':
      return 'Opus 4.6';
    case 'google-3.1-pro':
      return 'G-3.1-Pro';
    case 'google-2.5-flash':
      return 'G-2.5-Flash';
    case 'moonshot-kimi-k2.6':
      return 'Kimi K2.6';
    default:
      return alias;
  }
}

function renderLatexTables(evalPath: string) {
  const summary = summarizeEvalArtifact(evalPath);
  const topRules = summary.byRule.slice(0, 12);
  const topRuleCount = topRules.reduce((sum, [, count]) => sum + count, 0);
  const otherRuleCount = summary.totalFindings - topRuleCount;
  const lines: string[] = [];

  lines.push('% Generated by npm run paper:tables.');
  lines.push(`% Source artifact: ${evalPath}`);
  lines.push('');
  lines.push('\\begin{table}[ht]');
  lines.push('  \\centering');
  lines.push('  \\begin{tabular}{lr}');
  lines.push('    \\toprule');
  lines.push('    Metric & Value \\\\');
  lines.push('    \\midrule');
  lines.push(`    Prompts & ${summary.prompts} \\\\`);
  lines.push(`    Model aliases & ${summary.models} \\\\`);
  lines.push(`    Grid slots & ${summary.gridSlots} \\\\`);
  lines.push(`    Completed generations & ${summary.completedGenerations} \\\\`);
  lines.push(`    Parse errors & ${summary.parseErrors} \\\\`);
  lines.push(`    Generation errors & ${summary.generationErrors} \\\\`);
  lines.push(`    Benchmark violations & ${summary.totalFindings} \\\\`);
  lines.push('    \\bottomrule');
  lines.push('  \\end{tabular}');
  lines.push(
    '  \\caption{Expanded raw prompt-to-code benchmark run before detector-quality labeling.}',
  );
  lines.push('  \\label{tab:expanded-grid}');
  lines.push('\\end{table}');
  lines.push('');
  lines.push('\\begin{table}[ht]');
  lines.push('  \\centering');
  lines.push('  \\small');
  lines.push('  \\begin{tabular}{lrrrrr}');
  lines.push('    \\toprule');
  lines.push(
    '    Model alias & Linted runs & Parse errors & Gen. errors & Findings & Findings/linted \\\\',
  );
  lines.push('    \\midrule');
  for (const [modelAlias, stats] of summary.byModelStats) {
    lines.push(
      `    ${latexTexttt(modelAlias)} & ${stats.lintedRuns} & ${stats.parseErrors} & ${stats.generationErrors} & ${stats.findings} & ${formatRate(stats.findings, stats.lintedRuns)} \\\\`,
    );
  }
  lines.push('    \\bottomrule');
  lines.push('  \\end{tabular}');
  lines.push(
    '  \\caption{Expanded-grid findings by model. Linted runs exclude generation failures and parse failures.}',
  );
  lines.push('  \\label{tab:expanded-by-model}');
  lines.push('\\end{table}');
  lines.push('');
  lines.push('\\begin{table}[ht]');
  lines.push('  \\centering');
  lines.push('  \\small');
  lines.push('  \\begin{tabular}{llrrrr}');
  lines.push('    \\toprule');
  lines.push('    Prompt & Platform & Linted runs & Parse errors & Gen. errors & Findings \\\\');
  lines.push('    \\midrule');
  for (const [promptId, stats] of summary.byPromptStats) {
    lines.push(
      `    ${latexTexttt(promptId)} & ${latexEscape(stats.platform ?? 'unknown')} & ${stats.lintedRuns} & ${stats.parseErrors} & ${stats.generationErrors} & ${stats.findings} \\\\`,
    );
  }
  lines.push('    \\bottomrule');
  lines.push('  \\end{tabular}');
  lines.push('  \\caption{Expanded-grid findings by prompt and target platform.}');
  lines.push('  \\label{tab:expanded-by-prompt}');
  lines.push('\\end{table}');
  lines.push('');
  lines.push('\\begin{table}[ht]');
  lines.push('  \\centering');
  lines.push('  \\scriptsize');
  lines.push('  \\begin{tabular}{llrr}');
  lines.push('    \\toprule');
  lines.push('    Rule & Category & Findings & Share \\\\');
  lines.push('    \\midrule');
  for (const [rule, count] of topRules) {
    const category = ruleMeta[rule]?.category ?? 'Unknown';
    lines.push(
      `    ${latexTexttt(rule)} & ${latexEscape(category)} & ${count} & ${formatPercent(count, summary.totalFindings)} \\\\`,
    );
  }
  if (otherRuleCount > 0) {
    lines.push(
      `    Other rules & -- & ${otherRuleCount} & ${formatPercent(otherRuleCount, summary.totalFindings)} \\\\`,
    );
  }
  lines.push('    \\bottomrule');
  lines.push('  \\end{tabular}');
  lines.push(
    '  \\caption{Most frequent expanded-grid benchmark violations by rule. The top twelve rules account for most raw findings.}',
  );
  lines.push('  \\label{tab:expanded-by-rule}');
  lines.push('\\end{table}');
  lines.push('');
  lines.push('\\begin{table}[ht]');
  lines.push('  \\centering');
  lines.push('  \\scriptsize');
  lines.push('  \\begingroup');
  lines.push('  \\setlength{\\tabcolsep}{3pt}');
  lines.push(`  \\begin{tabular}{l${'r'.repeat(summary.modelOrder.length)}}`);
  lines.push('    \\toprule');
  lines.push(
    `    Prompt & ${summary.modelOrder.map((modelAlias) => latexEscape(displayModelAlias(modelAlias))).join(' & ')} \\\\`,
  );
  lines.push('    \\midrule');
  for (const promptId of summary.promptOrder) {
    const cells = summary.matrix.get(promptId);
    const cellValues = summary.modelOrder.map((modelAlias) => {
      const cell = cells?.get(modelAlias);
      if (!cell) {
        return '$--$';
      }
      if (cell.generationError) {
        return 'G';
      }
      if (cell.parseError) {
        return 'P';
      }
      return String(cell.findings);
    });
    lines.push(`    ${latexTexttt(promptId)} & ${cellValues.join(' & ')} \\\\`);
  }
  lines.push('    \\bottomrule');
  lines.push('  \\end{tabular}');
  lines.push('  \\endgroup');
  lines.push(
    '  \\caption{Run-level expanded-grid finding counts. P denotes a generated file that failed parsing; G denotes a generation failure.}',
  );
  lines.push('  \\label{tab:expanded-grid-matrix}');
  lines.push('\\end{table}');

  return lines.join('\n') + '\n';
}

type RepairStats = {
  records: number;
  attempted: number;
  skippedGenerationErrors: number;
  baselineFindings: number;
  finalFindings: number;
  fixedFindings: number;
  baselineParseErrors: number;
  finalParseErrors: number;
  cleanAfterOne: number;
  cleanFinal: number;
  repairGenerationErrors: number;
  turnsToClean: number[];
  platform: string | null;
};

function emptyRepairStats(platform: string | null): RepairStats {
  return {
    records: 0,
    attempted: 0,
    skippedGenerationErrors: 0,
    baselineFindings: 0,
    finalFindings: 0,
    fixedFindings: 0,
    baselineParseErrors: 0,
    finalParseErrors: 0,
    cleanAfterOne: 0,
    cleanFinal: 0,
    repairGenerationErrors: 0,
    turnsToClean: [],
    platform,
  };
}

function isCleanRepairState({
  lintResults,
  parseError,
}: {
  lintResults: unknown[];
  parseError: unknown;
}) {
  return lintResults.length === 0 && !parseError;
}

function addRepairRecordStats({
  stats,
  record,
}: {
  stats: RepairStats;
  record: Record<string, unknown>;
}) {
  const skippedReason = getString(record.skippedReason);
  stats.records += 1;
  if (skippedReason === 'generation-error') {
    stats.skippedGenerationErrors += 1;
    return;
  }

  const baseline = isObject(record.baseline) ? record.baseline : {};
  const baselineLintResults = getArray(baseline.lintResults);
  const finalLintResults = getArray(record.finalLintResults);
  const baselineParseError = baseline.parseError;
  const finalParseError = record.finalParseError;
  const turns = getArray(record.turns);
  const firstTurn = isObject(turns[0]) ? turns[0] : null;
  const turnsToClean =
    typeof record.turnsToClean === 'number' && Number.isFinite(record.turnsToClean)
      ? record.turnsToClean
      : null;

  if (skippedReason === null) {
    stats.attempted += 1;
  }
  stats.baselineFindings += baselineLintResults.length;
  stats.finalFindings += finalLintResults.length;
  stats.fixedFindings += baselineLintResults.length - finalLintResults.length;
  if (baselineParseError) {
    stats.baselineParseErrors += 1;
  }
  if (finalParseError) {
    stats.finalParseErrors += 1;
  }
  if (
    firstTurn &&
    isCleanRepairState({
      lintResults: getArray(firstTurn.lintResults),
      parseError: firstTurn.parseError,
    })
  ) {
    stats.cleanAfterOne += 1;
  }
  if (isCleanRepairState({ lintResults: finalLintResults, parseError: finalParseError })) {
    stats.cleanFinal += 1;
  }
  if (skippedReason === null && record.finalGenerationError) {
    stats.repairGenerationErrors += 1;
  }
  if (turnsToClean !== null) {
    stats.turnsToClean.push(turnsToClean);
  }
}

function summarizeRepairArtifact(repairEvalPath: string) {
  const parsed: unknown = JSON.parse(readFileSync(repairEvalPath, 'utf8'));
  if (!isObject(parsed)) {
    throw new Error(`${repairEvalPath}: expected object`);
  }

  const records = getArray(parsed.records).filter(isObject);
  const byModel = new Map<string, RepairStats>();
  const byPrompt = new Map<string, RepairStats>();
  const overall = emptyRepairStats(null);
  let maxRepairTurns = 0;

  for (const record of records) {
    const prompt = isObject(record.prompt) ? record.prompt : {};
    const model = isObject(record.model) ? record.model : {};
    const promptId = getString(prompt.id) ?? 'unknown-prompt';
    const promptPlatform = getString(prompt.platform);
    const modelAlias = getString(model.alias) ?? 'unknown-model';
    const turns = getArray(record.turns);
    maxRepairTurns = Math.max(maxRepairTurns, turns.length);

    addRepairRecordStats({ stats: overall, record });

    const modelStats = byModel.get(modelAlias) ?? emptyRepairStats(null);
    byModel.set(modelAlias, modelStats);
    addRepairRecordStats({ stats: modelStats, record });

    const promptStats = byPrompt.get(promptId) ?? emptyRepairStats(promptPlatform);
    byPrompt.set(promptId, promptStats);
    addRepairRecordStats({ stats: promptStats, record });
  }

  return {
    name: basename(repairEvalPath),
    maxRepairTurns,
    ...overall,
    byModel: [...byModel.entries()].sort(
      (a, b) =>
        b[1].attempted - a[1].attempted ||
        b[1].fixedFindings - a[1].fixedFindings ||
        a[0].localeCompare(b[0]),
    ),
    byPrompt: [...byPrompt.entries()].sort(
      (a, b) => b[1].fixedFindings - a[1].fixedFindings || a[0].localeCompare(b[0]),
    ),
  };
}

function formatAverageTurns(turnsToClean: number[]) {
  if (turnsToClean.length === 0) {
    return '$--$';
  }
  return (turnsToClean.reduce((sum, turns) => sum + turns, 0) / turnsToClean.length).toFixed(1);
}

function renderRepairLatexTables(repairEvalPath: string) {
  const summary = summarizeRepairArtifact(repairEvalPath);
  const lines: string[] = [];

  lines.push('% Generated by npm run paper:tables.');
  lines.push(`% Source artifact: ${repairEvalPath}`);
  lines.push('');
  lines.push('\\begin{table}[ht]');
  lines.push('  \\centering');
  lines.push('  \\begin{tabular}{lr}');
  lines.push('    \\toprule');
  lines.push('    Metric & Value \\\\');
  lines.push('    \\midrule');
  lines.push(`    Baseline records & ${summary.records} \\\\`);
  lines.push(`    Skipped baseline generation errors & ${summary.skippedGenerationErrors} \\\\`);
  lines.push(`    Attempted repairs & ${summary.attempted} \\\\`);
  lines.push(`    Maximum repair turns & ${summary.maxRepairTurns} \\\\`);
  lines.push(`    Baseline benchmark violations & ${summary.baselineFindings} \\\\`);
  lines.push(`    Final benchmark violations & ${summary.finalFindings} \\\\`);
  lines.push(
    `    Violations fixed & ${summary.fixedFindings} (${formatPercent(summary.fixedFindings, summary.baselineFindings)}) \\\\`,
  );
  lines.push(`    Baseline parse errors & ${summary.baselineParseErrors} \\\\`);
  lines.push(`    Final parse errors & ${summary.finalParseErrors} \\\\`);
  lines.push(`    Clean after one turn & ${summary.cleanAfterOne} \\\\`);
  lines.push(`    Clean after max turns & ${summary.cleanFinal} \\\\`);
  lines.push(`    Repair generation errors & ${summary.repairGenerationErrors} \\\\`);
  lines.push('    \\bottomrule');
  lines.push('  \\end{tabular}');
  lines.push(
    '  \\caption{Repair-loop pilot over the expanded grid. Each attempted repair feeds laint diagnostics back to the same model for up to three turns.}',
  );
  lines.push('  \\label{tab:repair-summary}');
  lines.push('\\end{table}');
  lines.push('');
  lines.push('\\begin{table}[ht]');
  lines.push('  \\centering');
  lines.push('  \\scriptsize');
  lines.push('  \\begin{tabular}{lrrrrrr}');
  lines.push('    \\toprule');
  lines.push('    Model & Initial & Final & Fixed & Clean 1-turn & Clean final & Avg. turns \\\\');
  lines.push('    \\midrule');
  for (const [modelAlias, stats] of summary.byModel) {
    if (stats.attempted === 0) {
      continue;
    }
    lines.push(
      `    ${latexEscape(displayModelAlias(modelAlias))} & ${stats.baselineFindings} & ${stats.finalFindings} & ${formatPercent(stats.fixedFindings, stats.baselineFindings)} & ${stats.cleanAfterOne}/${stats.attempted} & ${stats.cleanFinal}/${stats.attempted} & ${formatAverageTurns(stats.turnsToClean)} \\\\`,
    );
  }
  lines.push('    \\bottomrule');
  lines.push('  \\end{tabular}');
  lines.push(
    '  \\caption{Repair-loop outcomes by model, excluding baseline generation failures. Average turns is computed over runs that reached zero findings and no parse error.}',
  );
  lines.push('  \\label{tab:repair-by-model}');
  lines.push('\\end{table}');
  lines.push('');
  lines.push('\\begin{table}[ht]');
  lines.push('  \\centering');
  lines.push('  \\scriptsize');
  lines.push('  \\begin{tabular}{llrrrr}');
  lines.push('    \\toprule');
  lines.push('    Prompt & Platform & Initial & Final & Fixed & Clean final \\\\');
  lines.push('    \\midrule');
  for (const [promptId, stats] of summary.byPrompt) {
    if (stats.attempted === 0) {
      continue;
    }
    lines.push(
      `    ${latexTexttt(promptId)} & ${latexEscape(stats.platform ?? 'unknown')} & ${stats.baselineFindings} & ${stats.finalFindings} & ${formatPercent(stats.fixedFindings, stats.baselineFindings)} & ${stats.cleanFinal}/${stats.attempted} \\\\`,
    );
  }
  lines.push('    \\bottomrule');
  lines.push('  \\end{tabular}');
  lines.push('  \\caption{Repair-loop outcomes by prompt and platform.}');
  lines.push('  \\label{tab:repair-by-prompt}');
  lines.push('\\end{table}');

  return lines.join('\n') + '\n';
}

function printEvalStats(evalPath: string) {
  const summary = summarizeEvalArtifact(evalPath);

  console.log('');
  console.log('## Prompt Grid Evaluation');
  console.log('');
  console.log(`- Source artifact: ${evalPath}`);
  console.log(`- Prompts: ${summary.prompts}`);
  console.log(`- Model aliases: ${summary.models}`);
  console.log(`- Grid slots: ${summary.gridSlots}`);
  console.log(`- Completed generations: ${summary.completedGenerations}`);
  console.log(`- Parse errors: ${summary.parseErrors}`);
  console.log(`- Generation errors: ${summary.generationErrors}`);
  console.log(`- Benchmark violations: ${summary.totalFindings}`);
  console.log('');
  console.log('### Findings By Rule');
  console.log('');
  for (const [rule, count] of summary.byRule) {
    console.log(`- ${rule}: ${count}`);
  }
  console.log('');
  console.log('### Findings By Model');
  console.log('');
  for (const [model, count] of summary.byModel) {
    console.log(`- ${model}: ${count}`);
  }
  console.log('');
  console.log('### LaTeX Metric Rows');
  console.log('');
  console.log('```tex');
  console.log(`    Prompts & ${summary.prompts} \\\\`);
  console.log(`    Model aliases & ${summary.models} \\\\`);
  console.log(`    Grid slots & ${summary.gridSlots} \\\\`);
  console.log(`    Completed generations & ${summary.completedGenerations} \\\\`);
  console.log(`    Parse errors & ${summary.parseErrors} \\\\`);
  console.log(`    Generation errors & ${summary.generationErrors} \\\\`);
  console.log(`    Benchmark violations & ${summary.totalFindings} \\\\`);
  console.log('```');
}

function printRepairStats(repairEvalPath: string) {
  const summary = summarizeRepairArtifact(repairEvalPath);

  console.log('');
  console.log('## Repair Loop Evaluation');
  console.log('');
  console.log(`- Source artifact: ${repairEvalPath}`);
  console.log(`- Baseline records: ${summary.records}`);
  console.log(`- Attempted repairs: ${summary.attempted}`);
  console.log(`- Skipped generation errors: ${summary.skippedGenerationErrors}`);
  console.log(`- Maximum repair turns: ${summary.maxRepairTurns}`);
  console.log(`- Baseline benchmark violations: ${summary.baselineFindings}`);
  console.log(`- Final benchmark violations: ${summary.finalFindings}`);
  console.log(
    `- Violations fixed: ${summary.fixedFindings} (${formatPercent(summary.fixedFindings, summary.baselineFindings)})`,
  );
  console.log(`- Baseline parse errors: ${summary.baselineParseErrors}`);
  console.log(`- Final parse errors: ${summary.finalParseErrors}`);
  console.log(`- Clean after one turn: ${summary.cleanAfterOne}`);
  console.log(`- Clean after max turns: ${summary.cleanFinal}`);
  console.log(`- Repair generation errors: ${summary.repairGenerationErrors}`);
  console.log('');
  console.log('### Repair By Model');
  console.log('');
  for (const [model, stats] of summary.byModel) {
    console.log(
      `- ${model}: ${stats.baselineFindings} -> ${stats.finalFindings}, clean ${stats.cleanFinal}/${stats.attempted}`,
    );
  }
  console.log('');
  console.log('### Repair By Prompt');
  console.log('');
  for (const [prompt, stats] of summary.byPrompt) {
    console.log(
      `- ${prompt}: ${stats.baselineFindings} -> ${stats.finalFindings}, clean ${stats.cleanFinal}/${stats.attempted}`,
    );
  }
}

const options = parseArgs();
printRuleStats();
if (options.evalPath) {
  printEvalStats(options.evalPath);
  if (options.latexOut) {
    mkdirSync(dirname(options.latexOut), { recursive: true });
    writeFileSync(options.latexOut, renderLatexTables(options.evalPath));
    console.log('');
    console.log(`Wrote LaTeX tables to ${options.latexOut}`);
  }
}
if (options.repairEvalPath) {
  printRepairStats(options.repairEvalPath);
  if (options.repairLatexOut) {
    mkdirSync(dirname(options.repairLatexOut), { recursive: true });
    writeFileSync(options.repairLatexOut, renderRepairLatexTables(options.repairEvalPath));
    console.log('');
    console.log(`Wrote repair LaTeX tables to ${options.repairLatexOut}`);
  }
}
