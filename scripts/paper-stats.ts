import { readFileSync, readdirSync } from 'node:fs';
import { basename } from 'node:path';
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
  const options: { evalPath: string | null } = {
    evalPath: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === '--eval' && next) {
      options.evalPath = next;
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

Examples:
  npm run paper:stats
  npm run paper:stats -- --eval paper/eval/artifacts/initial-grid/results.json
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
  let totalFindings = 0;
  let parseErrors = 0;
  let generationErrors = 0;

  for (const record of records) {
    if (!isObject(record)) {
      continue;
    }

    const prompt = isObject(record.prompt) ? record.prompt : {};
    const model = isObject(record.model) ? record.model : {};
    const promptId = getString(prompt.id);
    const modelAlias = getString(model.alias);
    const lintResults = getArray(record.lintResults);

    if (promptId) {
      promptIds.add(promptId);
    }
    if (modelAlias) {
      modelAliases.add(modelAlias);
      byModel.set(modelAlias, (byModel.get(modelAlias) ?? 0) + lintResults.length);
    }
    if (record.parseError) {
      parseErrors += 1;
    }
    if (record.generationError) {
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
  };
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

const options = parseArgs();
printRuleStats();
if (options.evalPath) {
  printEvalStats(options.evalPath);
}
