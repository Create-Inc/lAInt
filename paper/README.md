# Laint Paper Draft

This directory contains an initial arXiv-style paper draft for laint.

## Current Shape

The draft is intentionally framed as a research/tool paper, not a product announcement. The strongest publishable angle is:

> Agent-oriented linting for generated JSX/TSX applications catches framework-specific web, mobile, and backend failures earlier than conventional build/type/runtime feedback.

## Before Submission

- Add real authors and affiliations.
- Decide whether this targets arXiv only, a workshop, or both.
- Run the prompt-to-code detector-quality evaluation described in `main.tex`.
- Replace the evaluation-plan section with measured results.
- Add citations to relevant program-repair and LLM-code-generation work.
- Build the PDF from `main.tex` and inspect it before submission.

## Version Pinning

This draft pins its rule counts and preliminary benchmark results to `main` commit
`6a60a0295955ee6cc1d639c88955ea50722e3516` from 2026-05-14.

For future papers or follow-up benchmark runs, record:

- The exact `main` commit or benchmark tag used for the laint rule corpus.
- The prompt suite version.
- The model IDs and provider versions used for generation.
- The run date and output directory.

A future tag scheme such as `benchmark/agent-oriented-linting-2026-05` or
`paper/agent-oriented-linting-v1` would make these runs easier to cite without
depending on floating branch names.

## Reproducing Paper Numbers

Every numeric claim in the draft should either be calculated from repository
source or from a checked-in benchmark artifact.

Rule corpus counts, severity counts, platform counts, and the category table are
calculated from `src/rules/*` metadata:

```bash
npm run paper:stats
```

The preliminary prompt-grid numbers in `main.tex` are calculated from the
archived run artifact at `paper/eval/artifacts/initial-grid/results.json`:

```bash
npm run paper:stats -- --eval paper/eval/artifacts/initial-grid/results.json
```

There is also a larger raw grid artifact at
`paper/eval/artifacts/full-grid-2026-05-17/results.json`:

```bash
npm run paper:stats -- --eval paper/eval/artifacts/full-grid-2026-05-17/results.json
```

The expanded-grid tables included by `main.tex` are generated from that artifact:

```bash
npm run paper:tables
```

This rewrites `paper/generated/full-grid-tables.tex` and
`paper/generated/repair-loop-tables.tex`, which are checked in so the paper
source can build directly while still keeping the table values reproducible from
the archived JSON artifacts.

This raw run covers 6 prompts and 7 configured model aliases. Moonshot/Kimi failed
all 6 generations due provider authentication/network errors, so use this
artifact as raw evidence rather than final paper numbers until the Moonshot
credential path is fixed or the reported model grid is explicitly scoped to the
6 working model aliases.

The repair-loop pilot uses the full-grid artifact as its baseline and is archived
at `paper/eval/artifacts/repair-loop-2026-05-27/results.json`. It can be rerun
with Doppler-provided model keys:

```bash
doppler run --project flux-worker --config dev -- npm run eval:repair-loop -- --max-turns 3 --out paper/eval/results/repair-loop-2026-05-27
```

The generated app files under `paper/eval/results/` remain ignored because they
are working outputs. If a benchmark run contributes numbers to a paper, archive
the corresponding `results.json` under `paper/eval/artifacts/<run-name>/` or
attach it to a tagged release before citing the numbers.

## Suggested Evaluation Data

- A prompt suite covering web, mobile, and backend app-building tasks.
- Generated JSX/TSX outputs from one or more LLMs.
- Laint findings for each generated output.
- Human labels for whether each finding is a valid, invalid, or ambiguous violation.
- Missed-defect labels for recall, when an independently reviewed corpus is available.
- TypeScript, framework build, web preview, mobile simulator/device preview, and runtime outcomes.
- Diagnostic-compliance outcomes after lint feedback: fixed violations, turns to a clean lint state, new violations, parse errors, and repair iteration counts.

## Prompt Grid

Run a small prompt-to-code grid with Doppler-provided model keys:

```bash
doppler run --project flux-worker --config dev -- npm run eval:prompt-grid
```

Useful options:

```bash
npm run eval:prompt-grid -- --limit 2
npm run eval:prompt-grid -- --models openai-gpt-5.5,anthropic-sonnet-4.6,google-3.1-pro
npm run eval:prompt-grid -- --out paper/eval/results/my-run
```

The runner writes raw generated files, `results.json`, `summary.md`, and `labels.todo.jsonl`
under `paper/eval/results/`. That directory is intentionally ignored by git.
