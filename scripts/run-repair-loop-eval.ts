import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { LintResult, Platform } from '../src/types';

interface PromptCase {
  id: string;
  platform: Platform;
  source: string;
  description: string;
  outputFile: string;
}

interface ModelConfig {
  alias: string;
  provider: string;
  model: string;
  apiKeyEnv: string;
}

interface BaselineRecord {
  prompt: PromptCase;
  model: Omit<ModelConfig, 'apiKeyEnv'>;
  outputPath: string | null;
  code: string | null;
  lintResults: LintResult[];
  finishReason: string | null;
  parseError: string | null;
  generationError: string | null;
  usage: unknown;
}

interface RepairTurn {
  turn: number;
  outputPath: string | null;
  code: string | null;
  lintResults: LintResult[];
  finishReason: string | null;
  parseError: string | null;
  generationError: string | null;
  usage: unknown;
}

interface RepairRecord {
  prompt: PromptCase;
  model: Omit<ModelConfig, 'apiKeyEnv'>;
  baseline: BaselineRecord;
  skippedReason: 'generation-error' | 'already-clean' | null;
  turns: RepairTurn[];
  finalLintResults: LintResult[];
  finalParseError: string | null;
  finalGenerationError: string | null;
  turnsToClean: number | null;
}

type LintJsxCode = (code: string, config: { platform: Platform }) => LintResult[];

let cachedLintJsxCode: LintJsxCode | null = null;

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'openai-gpt-5.5': {
    alias: 'openai-gpt-5.5',
    provider: 'openai',
    model: 'gpt-5.5',
    apiKeyEnv: 'OPENAI_API_KEY',
  },
  'openai-gpt-5.4': {
    alias: 'openai-gpt-5.4',
    provider: 'openai',
    model: 'gpt-5.4-2026-03-05',
    apiKeyEnv: 'OPENAI_API_KEY',
  },
  'anthropic-sonnet-4.6': {
    alias: 'anthropic-sonnet-4.6',
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
  },
  'anthropic-opus-4.6': {
    alias: 'anthropic-opus-4.6',
    provider: 'anthropic',
    model: 'claude-opus-4-6',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
  },
  'google-3.1-pro': {
    alias: 'google-3.1-pro',
    provider: 'google',
    model: 'gemini-3.1-pro-preview',
    apiKeyEnv: 'GOOGLE_GEMINI_API_KEY',
  },
  'google-2.5-flash': {
    alias: 'google-2.5-flash',
    provider: 'google',
    model: 'gemini-2.5-flash',
    apiKeyEnv: 'GOOGLE_GEMINI_API_KEY',
  },
  'moonshot-kimi-k2.6': {
    alias: 'moonshot-kimi-k2.6',
    provider: 'moonshot',
    model: 'kimi-k2.6',
    apiKeyEnv: 'MOONSHOT_API_KEY',
  },
};

function parseArgs() {
  const args = process.argv.slice(2);
  const options: {
    inputPath: string;
    outDir: string;
    models: string[] | null;
    limit: number | null;
    maxTurns: number;
    maxTokens: number;
  } = {
    inputPath: 'paper/eval/artifacts/full-grid-2026-05-17/results.json',
    outDir: `paper/eval/results/repair-loop-${new Date().toISOString().replace(/[:.]/g, '-')}`,
    models: null,
    limit: null,
    maxTurns: Number(process.env.LAINT_REPAIR_MAX_TURNS ?? 3),
    maxTokens: Number(process.env.LAINT_EVAL_MAX_TOKENS ?? 12000),
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === '--input' && next) {
      options.inputPath = next;
      index += 1;
    } else if (arg === '--out' && next) {
      options.outDir = next;
      index += 1;
    } else if (arg === '--models' && next) {
      options.models = next.split(',').filter(Boolean);
      index += 1;
    } else if (arg === '--limit' && next) {
      options.limit = Number(next);
      index += 1;
    } else if (arg === '--max-turns' && next) {
      options.maxTurns = Number(next);
      index += 1;
    } else if (arg === '--max-tokens' && next) {
      options.maxTokens = Number(next);
      index += 1;
    } else if (arg === '--help') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage: npm run eval:repair-loop -- [options]

Options:
  --input <path>        Baseline prompt-grid results.json artifact
  --out <path>          Output directory (default: timestamp under paper/eval/results)
  --models <aliases>    Comma-separated model aliases to repair
  --limit <n>           Limit baseline records for a smoke run
  --max-turns <n>       Maximum repair turns per record (default: 3)
  --max-tokens <n>      Max completion tokens per repair generation (default: 12000)

Run with Doppler, for example:
  doppler run --project flux-worker --config dev -- npm run eval:repair-loop -- --limit 2 --max-turns 1
`);
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required. Run through Doppler or export it locally.`);
  }
  return value;
}

async function loadBaselineRecords({
  inputPath,
  models,
  limit,
}: {
  inputPath: string;
  models: string[] | null;
  limit: number | null;
}) {
  const text = await readFile(inputPath, 'utf8');
  const parsed = JSON.parse(text) as { records: BaselineRecord[] };
  const modelSet = models ? new Set(models) : null;
  const records = parsed.records.filter((record) => !modelSet || modelSet.has(record.model.alias));
  return limit === null ? records : records.slice(0, limit);
}

function resolveModel(alias: string) {
  const model = MODEL_CONFIGS[alias];
  if (!model) {
    throw new Error(`Unknown model alias "${alias}".`);
  }
  return model;
}

function extractCode(content: string) {
  const fenceMatch = content.match(/```(?:tsx|ts|jsx|js)?\s*([\s\S]*?)```/);
  return (fenceMatch?.[1] ?? content).trim();
}

function formatDiagnostics({
  lintResults,
  parseError,
}: {
  lintResults: LintResult[];
  parseError: string | null;
}) {
  const lines: string[] = [];
  if (parseError) {
    lines.push(`- parse-error: ${parseError}`);
  }
  for (const result of lintResults) {
    lines.push(
      `- ${result.rule} (${result.severity}) at ${result.line}:${result.column}: ${result.message}`,
    );
  }
  return lines.join('\n');
}

function buildRepairPrompt({
  prompt,
  code,
  lintResults,
  parseError,
}: {
  prompt: PromptCase;
  code: string;
  lintResults: LintResult[];
  parseError: string | null;
}) {
  const diagnostics = formatDiagnostics({ lintResults, parseError });

  return `Revise the file ${prompt.outputFile}.

Original task:
${prompt.description}

Target platform: ${prompt.platform}

The current file has the following laint diagnostics:
${diagnostics}

Return a corrected complete version of the same source file. Preserve the intended behavior and public exports. Fix the diagnostics directly instead of suppressing them or adding comments about linting.

Output only the code for this one file. Do not wrap the answer in Markdown fences.

Current code:
${code}`;
}

async function callRepairModel({
  model,
  prompt,
  code,
  lintResults,
  parseError,
  maxTokens,
}: {
  model: ModelConfig;
  prompt: PromptCase;
  code: string;
  lintResults: LintResult[];
  parseError: string | null;
  maxTokens: number;
}) {
  const portkeyBaseUrl = requireEnv('PORTKEY_API_BASE_URL').replace(/\/$/, '');
  const bearerToken = requireEnv('OPENAI_API_KEY');
  const providerApiKey = requireEnv(model.apiKeyEnv);
  const tokenParam = model.provider === 'openai' ? 'max_completion_tokens' : 'max_tokens';
  const response = await fetch(`${portkeyBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
      'x-portkey-config': JSON.stringify({
        retry: {
          attempts: 2,
          on_status_codes: [500, 502, 503, 504, 520, 529, 530],
        },
        provider: model.provider,
        api_key: providerApiKey,
        override_params: {
          model: model.model,
          [tokenParam]: maxTokens,
        },
      }),
    },
    body: JSON.stringify({
      model: model.model,
      ...(model.provider === 'openai' ? {} : { temperature: 0.2 }),
      [tokenParam]: maxTokens,
      messages: [
        {
          role: 'system',
          content:
            'You are a senior application engineer repairing a generated source file. Return only the corrected source file code.',
        },
        {
          role: 'user',
          content: buildRepairPrompt({
            prompt,
            code,
            lintResults,
            parseError,
          }),
        },
      ],
    }),
  });

  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${bodyText.slice(0, 1000)}`);
  }

  const body = JSON.parse(bodyText);
  const content = body?.choices?.[0]?.message?.content;

  if (typeof content !== 'string') {
    throw new Error(`Unexpected response shape: ${bodyText.slice(0, 1000)}`);
  }

  return {
    code: extractCode(content),
    finishReason:
      typeof body?.choices?.[0]?.finish_reason === 'string' ? body.choices[0].finish_reason : null,
    usage: body?.usage ?? null,
  };
}

async function getLintJsxCode() {
  if (cachedLintJsxCode) {
    return cachedLintJsxCode;
  }

  const laintModule: { lintJsxCode: LintJsxCode } = await import('../dist/index.js');
  cachedLintJsxCode = laintModule.lintJsxCode;
  return cachedLintJsxCode;
}

function isClean({
  lintResults,
  parseError,
}: {
  lintResults: LintResult[];
  parseError: string | null;
}) {
  return lintResults.length === 0 && parseError === null;
}

async function lintCode({ code, platform }: { code: string; platform: Platform }) {
  try {
    const lintJsxCode = await getLintJsxCode();
    return {
      lintResults: lintJsxCode(code, { platform }),
      parseError: null,
    };
  } catch (error) {
    return {
      lintResults: [],
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runRepairRecord({
  baseline,
  outDir,
  maxTurns,
  maxTokens,
}: {
  baseline: BaselineRecord;
  outDir: string;
  maxTurns: number;
  maxTokens: number;
}): Promise<RepairRecord> {
  if (!baseline.code || baseline.generationError) {
    return {
      prompt: baseline.prompt,
      model: baseline.model,
      baseline,
      skippedReason: 'generation-error',
      turns: [],
      finalLintResults: baseline.lintResults,
      finalParseError: baseline.parseError,
      finalGenerationError: null,
      turnsToClean: null,
    };
  }

  if (isClean({ lintResults: baseline.lintResults, parseError: baseline.parseError })) {
    return {
      prompt: baseline.prompt,
      model: baseline.model,
      baseline,
      skippedReason: 'already-clean',
      turns: [],
      finalLintResults: baseline.lintResults,
      finalParseError: baseline.parseError,
      finalGenerationError: null,
      turnsToClean: 0,
    };
  }

  const model = resolveModel(baseline.model.alias);
  const repairDir = path.join(outDir, 'repairs', model.alias, baseline.prompt.id);
  await mkdir(repairDir, { recursive: true });

  let currentCode = baseline.code;
  let currentLintResults = baseline.lintResults;
  let currentParseError = baseline.parseError;
  let finalGenerationError: string | null = null;
  const turns: RepairTurn[] = [];

  for (let turn = 1; turn <= maxTurns; turn += 1) {
    const outputPath = path.join(
      repairDir,
      `turn-${turn}-${path.basename(baseline.prompt.outputFile)}`,
    );

    try {
      const { code, finishReason, usage } = await callRepairModel({
        model,
        prompt: baseline.prompt,
        code: currentCode,
        lintResults: currentLintResults,
        parseError: currentParseError,
        maxTokens,
      });
      await writeFile(outputPath, code);

      const { lintResults, parseError } = await lintCode({
        code,
        platform: baseline.prompt.platform,
      });

      const repairTurn: RepairTurn = {
        turn,
        outputPath,
        code,
        lintResults,
        finishReason,
        parseError,
        generationError: null,
        usage,
      };
      turns.push(repairTurn);

      currentCode = code;
      currentLintResults = lintResults;
      currentParseError = parseError;

      if (isClean({ lintResults, parseError })) {
        return {
          prompt: baseline.prompt,
          model: baseline.model,
          baseline,
          skippedReason: null,
          turns,
          finalLintResults: lintResults,
          finalParseError: parseError,
          finalGenerationError: null,
          turnsToClean: turn,
        };
      }
    } catch (error) {
      finalGenerationError = error instanceof Error ? error.message : String(error);
      turns.push({
        turn,
        outputPath: null,
        code: null,
        lintResults: currentLintResults,
        finishReason: null,
        parseError: currentParseError,
        generationError: finalGenerationError,
        usage: null,
      });
      break;
    }
  }

  return {
    prompt: baseline.prompt,
    model: baseline.model,
    baseline,
    skippedReason: null,
    turns,
    finalLintResults: currentLintResults,
    finalParseError: currentParseError,
    finalGenerationError,
    turnsToClean: null,
  };
}

function summarize(records: RepairRecord[]) {
  const repairableRecords = records.filter((record) => record.skippedReason !== 'generation-error');
  const attemptedRecords = records.filter((record) => record.skippedReason === null);
  const baselineFindings = repairableRecords.reduce(
    (sum, record) => sum + record.baseline.lintResults.length,
    0,
  );
  const finalFindings = repairableRecords.reduce(
    (sum, record) => sum + record.finalLintResults.length,
    0,
  );
  const byModel = new Map<
    string,
    {
      records: number;
      attempted: number;
      skippedGenerationErrors: number;
      baselineFindings: number;
      finalFindings: number;
      baselineParseErrors: number;
      finalParseErrors: number;
      cleanAfterOne: number;
      cleanFinal: number;
      repairGenerationErrors: number;
      turnsToClean: number[];
    }
  >();

  for (const record of records) {
    const stats = byModel.get(record.model.alias) ?? {
      records: 0,
      attempted: 0,
      skippedGenerationErrors: 0,
      baselineFindings: 0,
      finalFindings: 0,
      baselineParseErrors: 0,
      finalParseErrors: 0,
      cleanAfterOne: 0,
      cleanFinal: 0,
      repairGenerationErrors: 0,
      turnsToClean: [],
    };
    byModel.set(record.model.alias, stats);

    stats.records += 1;
    if (record.skippedReason === 'generation-error') {
      stats.skippedGenerationErrors += 1;
      continue;
    }
    stats.baselineFindings += record.baseline.lintResults.length;
    stats.finalFindings += record.finalLintResults.length;
    if (record.baseline.parseError) {
      stats.baselineParseErrors += 1;
    }
    if (record.finalParseError) {
      stats.finalParseErrors += 1;
    }
    if (record.skippedReason === null) {
      stats.attempted += 1;
    }
    if (
      record.turns.length >= 1 &&
      isClean({
        lintResults: record.turns[0]?.lintResults ?? [],
        parseError: record.turns[0]?.parseError ?? null,
      })
    ) {
      stats.cleanAfterOne += 1;
    }
    if (isClean({ lintResults: record.finalLintResults, parseError: record.finalParseError })) {
      stats.cleanFinal += 1;
    }
    if (record.skippedReason === null && record.finalGenerationError) {
      stats.repairGenerationErrors += 1;
    }
    if (record.turnsToClean !== null) {
      stats.turnsToClean.push(record.turnsToClean);
    }
  }

  return {
    records: records.length,
    repairableRecords: repairableRecords.length,
    attemptedRecords: attemptedRecords.length,
    skippedGenerationErrors: records.filter((record) => record.skippedReason === 'generation-error')
      .length,
    baselineFindings,
    finalFindings,
    fixedFindings: baselineFindings - finalFindings,
    baselineParseErrors: repairableRecords.filter((record) => record.baseline.parseError).length,
    finalParseErrors: repairableRecords.filter((record) => record.finalParseError).length,
    cleanAfterOne: records.filter(
      (record) =>
        record.turns.length >= 1 &&
        isClean({
          lintResults: record.turns[0]?.lintResults ?? [],
          parseError: record.turns[0]?.parseError ?? null,
        }),
    ).length,
    cleanFinal: repairableRecords.filter((record) =>
      isClean({ lintResults: record.finalLintResults, parseError: record.finalParseError }),
    ).length,
    repairGenerationErrors: records.filter(
      (record) => record.skippedReason === null && record.finalGenerationError,
    ).length,
    byModel: Object.fromEntries(
      [...byModel.entries()].map(([model, stats]) => [
        model,
        {
          ...stats,
          avgTurnsToClean:
            stats.turnsToClean.length === 0
              ? null
              : Number(
                  (
                    stats.turnsToClean.reduce((sum, turns) => sum + turns, 0) /
                    stats.turnsToClean.length
                  ).toFixed(2),
                ),
        },
      ]),
    ),
  };
}

function buildMarkdownSummary({
  records,
  summary,
}: {
  records: RepairRecord[];
  summary: ReturnType<typeof summarize>;
}) {
  const lines = [
    '# Repair Loop Evaluation',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Records: ${summary.records}`,
    `- Repairable records: ${summary.repairableRecords}`,
    `- Attempted records: ${summary.attemptedRecords}`,
    `- Skipped generation errors: ${summary.skippedGenerationErrors}`,
    `- Baseline findings: ${summary.baselineFindings}`,
    `- Final findings: ${summary.finalFindings}`,
    `- Fixed findings: ${summary.fixedFindings}`,
    `- Baseline parse errors: ${summary.baselineParseErrors}`,
    `- Final parse errors: ${summary.finalParseErrors}`,
    `- Clean after one turn: ${summary.cleanAfterOne}`,
    `- Clean final: ${summary.cleanFinal}`,
    `- Repair generation errors: ${summary.repairGenerationErrors}`,
    '',
    '## By Model',
    '',
    ...Object.entries(summary.byModel).map(
      ([model, stats]) => `- \`${model}\`: ${JSON.stringify(stats)}`,
    ),
    '',
    '## Runs',
    '',
  ];

  for (const record of records) {
    lines.push(
      `- \`${record.model.alias}\` / \`${record.prompt.id}\`: ` +
        `baseline=${record.baseline.lintResults.length}` +
        (record.baseline.parseError ? ', baseline_parse=1' : '') +
        ` final=${record.finalLintResults.length}` +
        (record.finalParseError ? ', final_parse=1' : '') +
        (record.turnsToClean !== null ? ` turns_to_clean=${record.turnsToClean}` : '') +
        (record.skippedReason ? ` skipped=${record.skippedReason}` : '') +
        (record.skippedReason === null && record.finalGenerationError
          ? ' repair_generation_error=1'
          : ''),
    );
  }

  return `${lines.join('\n')}\n`;
}

async function main() {
  const options = parseArgs();
  const baselineRecords = await loadBaselineRecords({
    inputPath: options.inputPath,
    models: options.models,
    limit: options.limit,
  });

  await mkdir(options.outDir, { recursive: true });

  const records: RepairRecord[] = [];
  for (const baseline of baselineRecords) {
    console.log(`Repairing ${baseline.model.alias} on ${baseline.prompt.id}...`);
    const record = await runRepairRecord({
      baseline,
      outDir: options.outDir,
      maxTurns: options.maxTurns,
      maxTokens: options.maxTokens,
    });
    records.push(record);
    console.log(
      `  baseline=${record.baseline.lintResults.length}` +
        (record.baseline.parseError ? ' baseline_parse=1' : '') +
        ` final=${record.finalLintResults.length}` +
        (record.finalParseError ? ' final_parse=1' : '') +
        (record.turnsToClean !== null ? ` turns_to_clean=${record.turnsToClean}` : '') +
        (record.skippedReason ? ` skipped=${record.skippedReason}` : '') +
        (record.skippedReason === null && record.finalGenerationError
          ? ' repair_generation_error=1'
          : ''),
    );
  }

  const summary = summarize(records);
  await writeFile(
    path.join(options.outDir, 'results.json'),
    JSON.stringify({ summary, records }, null, 2),
  );
  await writeFile(
    path.join(options.outDir, 'summary.md'),
    buildMarkdownSummary({ records, summary }),
  );

  console.log(`\nWrote ${options.outDir}`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
