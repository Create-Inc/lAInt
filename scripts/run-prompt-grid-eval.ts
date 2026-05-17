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

interface GenerationRecord {
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

const DEFAULT_MODELS = ['openai-gpt-5.5', 'anthropic-sonnet-4.6', 'google-3.1-pro'];

function parseArgs() {
  const args = process.argv.slice(2);
  const options: {
    promptsPath: string;
    outDir: string;
    models: string[];
    limit: number | null;
    maxTokens: number;
  } = {
    promptsPath: 'paper/eval/prompts.json',
    outDir: `paper/eval/results/${new Date().toISOString().replace(/[:.]/g, '-')}`,
    models: process.env.LAINT_EVAL_MODELS?.split(',').filter(Boolean) ?? DEFAULT_MODELS,
    limit: null,
    maxTokens: Number(process.env.LAINT_EVAL_MAX_TOKENS ?? 12000),
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === '--prompts' && next) {
      options.promptsPath = next;
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
  console.log(`Usage: npm run eval:prompt-grid -- [options]

Options:
  --prompts <path>      Prompt suite JSON path (default: paper/eval/prompts.json)
  --out <path>          Output directory (default: timestamp under paper/eval/results)
  --models <aliases>    Comma-separated model aliases
  --limit <n>           Limit prompt cases for a smoke run
  --max-tokens <n>      Max completion tokens per generation (default: 12000)

Default models:
  ${DEFAULT_MODELS.join(', ')}

Known model aliases:
  ${Object.keys(MODEL_CONFIGS).join(', ')}

Run with Doppler, for example:
  doppler run --project flux-worker --config dev -- npm run eval:prompt-grid -- --limit 2
`);
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required. Run through Doppler or export it locally.`);
  }
  return value;
}

async function loadPrompts(promptsPath: string, limit: number | null) {
  const text = await readFile(promptsPath, 'utf8');
  const prompts = JSON.parse(text) as PromptCase[];
  return limit === null ? prompts : prompts.slice(0, limit);
}

function buildPrompt(prompt: PromptCase) {
  const platformGuidance =
    prompt.platform === 'expo'
      ? 'Target Expo / React Native. Produce one complete TSX screen or route file.'
      : prompt.platform === 'web'
        ? 'Target a Next.js App Router project. Produce one complete TSX file.'
        : 'Target a Next.js server route or serverless backend file. Produce one complete TypeScript file.';

  return `Create the file ${prompt.outputFile}.

Task: ${prompt.description}

${platformGuidance}

Requirements:
- Output only the code for this one file.
- Do not wrap the answer in Markdown fences.
- Include realistic imports and component/function exports.
- Keep the implementation compact, ideally under 180 lines.
- Make reasonable assumptions for missing project helpers.
- Write natural production-style code; do not mention linting or static analysis.`;
}

async function callModel({
  model,
  prompt,
  maxTokens,
}: {
  model: ModelConfig;
  prompt: PromptCase;
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
            'You are a senior application engineer. Return only the requested source file code.',
        },
        {
          role: 'user',
          content: buildPrompt(prompt),
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

function extractCode(content: string) {
  const fenceMatch = content.match(/```(?:tsx|ts|jsx|js)?\s*([\s\S]*?)```/);
  return (fenceMatch?.[1] ?? content).trim();
}

async function getLintJsxCode() {
  if (cachedLintJsxCode) {
    return cachedLintJsxCode;
  }

  const laintModule: { lintJsxCode: LintJsxCode } = await import('../dist/index.js');
  cachedLintJsxCode = laintModule.lintJsxCode;
  return cachedLintJsxCode;
}

async function runOne({
  prompt,
  model,
  outDir,
  maxTokens,
}: {
  prompt: PromptCase;
  model: ModelConfig;
  outDir: string;
  maxTokens: number;
}): Promise<GenerationRecord> {
  const generationDir = path.join(outDir, 'generations', model.alias, prompt.id);
  await mkdir(generationDir, { recursive: true });
  const outputPath = path.join(generationDir, path.basename(prompt.outputFile));

  try {
    const { code, finishReason, usage } = await callModel({ model, prompt, maxTokens });
    await writeFile(outputPath, code);

    try {
      const lintJsxCode = await getLintJsxCode();
      const lintResults = lintJsxCode(code, { platform: prompt.platform });
      return {
        prompt,
        model: {
          alias: model.alias,
          provider: model.provider,
          model: model.model,
        },
        outputPath,
        code,
        lintResults,
        finishReason,
        parseError: null,
        generationError: null,
        usage,
      };
    } catch (error) {
      return {
        prompt,
        model: {
          alias: model.alias,
          provider: model.provider,
          model: model.model,
        },
        outputPath,
        code,
        lintResults: [],
        finishReason,
        parseError: error instanceof Error ? error.message : String(error),
        generationError: null,
        usage,
      };
    }
  } catch (error) {
    return {
      prompt,
      model: {
        alias: model.alias,
        provider: model.provider,
        model: model.model,
      },
      outputPath: null,
      code: null,
      lintResults: [],
      finishReason: null,
      parseError: null,
      generationError: error instanceof Error ? error.message : String(error),
      usage: null,
    };
  }
}

function resolveModels(modelAliases: string[]) {
  return modelAliases.map((alias) => {
    const model = MODEL_CONFIGS[alias];
    if (!model) {
      throw new Error(`Unknown model alias "${alias}". Run with --help to list known aliases.`);
    }
    return model;
  });
}

function summarize(records: GenerationRecord[]) {
  const totalFindings = records.reduce((sum, record) => sum + record.lintResults.length, 0);
  const parseErrors = records.filter((record) => record.parseError).length;
  const generationErrors = records.filter((record) => record.generationError).length;
  const byRule = new Map<string, number>();
  const byModel = new Map<string, number>();
  const byPrompt = new Map<string, number>();

  for (const record of records) {
    byModel.set(
      record.model.alias,
      (byModel.get(record.model.alias) ?? 0) + record.lintResults.length,
    );
    byPrompt.set(
      record.prompt.id,
      (byPrompt.get(record.prompt.id) ?? 0) + record.lintResults.length,
    );

    for (const result of record.lintResults) {
      byRule.set(result.rule, (byRule.get(result.rule) ?? 0) + 1);
    }
  }

  return {
    generations: records.length,
    totalFindings,
    parseErrors,
    generationErrors,
    byRule: Object.fromEntries([...byRule.entries()].sort((a, b) => b[1] - a[1])),
    byModel: Object.fromEntries([...byModel.entries()].sort((a, b) => b[1] - a[1])),
    byPrompt: Object.fromEntries([...byPrompt.entries()].sort((a, b) => b[1] - a[1])),
  };
}

function buildLabelsTodo(records: GenerationRecord[]) {
  const lines: string[] = [];

  for (const record of records) {
    for (const result of record.lintResults) {
      lines.push(
        JSON.stringify({
          label: null,
          promptId: record.prompt.id,
          platform: record.prompt.platform,
          model: record.model.alias,
          outputPath: record.outputPath,
          rule: result.rule,
          message: result.message,
          line: result.line,
          column: result.column,
          severity: result.severity,
          notes: '',
        }),
      );
    }
  }

  return lines.join('\n') + (lines.length ? '\n' : '');
}

function buildMarkdownSummary({
  records,
  summary,
}: {
  records: GenerationRecord[];
  summary: ReturnType<typeof summarize>;
}) {
  const lines = [
    '# Prompt Grid Evaluation',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Generations: ${summary.generations}`,
    `- Laint findings: ${summary.totalFindings}`,
    `- Parse errors: ${summary.parseErrors}`,
    `- Generation errors: ${summary.generationErrors}`,
    '',
    '## Findings By Rule',
    '',
    ...Object.entries(summary.byRule).map(([rule, count]) => `- \`${rule}\`: ${count}`),
    '',
    '## Findings By Model',
    '',
    ...Object.entries(summary.byModel).map(([model, count]) => `- \`${model}\`: ${count}`),
    '',
    '## Findings By Prompt',
    '',
    ...Object.entries(summary.byPrompt).map(([prompt, count]) => `- \`${prompt}\`: ${count}`),
    '',
    '## Runs',
    '',
  ];

  for (const record of records) {
    lines.push(
      `- \`${record.model.alias}\` / \`${record.prompt.id}\`: ${record.lintResults.length} findings` +
        (record.finishReason ? `, finish: ${record.finishReason}` : '') +
        (record.parseError ? `, parse error: ${record.parseError}` : '') +
        (record.generationError ? `, generation error: ${record.generationError}` : ''),
    );
  }

  return `${lines.join('\n')}\n`;
}

async function main() {
  const options = parseArgs();
  const prompts = await loadPrompts(options.promptsPath, options.limit);
  const models = resolveModels(options.models);

  await mkdir(options.outDir, { recursive: true });

  const records: GenerationRecord[] = [];

  for (const prompt of prompts) {
    for (const model of models) {
      console.log(`Running ${model.alias} on ${prompt.id}...`);
      const record = await runOne({
        prompt,
        model,
        outDir: options.outDir,
        maxTokens: options.maxTokens,
      });
      records.push(record);
      console.log(
        `  findings=${record.lintResults.length}` +
          (record.finishReason ? ` finish=${record.finishReason}` : '') +
          (record.parseError ? ' parse_error=1' : '') +
          (record.generationError ? ' generation_error=1' : ''),
      );
    }
  }

  const summary = summarize(records);
  await writeFile(
    path.join(options.outDir, 'results.json'),
    JSON.stringify({ summary, records }, null, 2),
  );
  await writeFile(path.join(options.outDir, 'labels.todo.jsonl'), buildLabelsTodo(records));
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
