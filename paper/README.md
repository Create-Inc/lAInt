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

## Suggested Evaluation Data

- A prompt suite covering web, mobile, and backend app-building tasks.
- Generated JSX/TSX outputs from one or more LLMs.
- Laint findings for each generated output.
- Human labels for whether each finding is a valid, invalid, or ambiguous violation.
- Missed-defect labels for recall, when an independently reviewed corpus is available.
- TypeScript, framework build, web preview, mobile simulator/device preview, and runtime outcomes.
- Repair iteration counts after lint feedback.

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
