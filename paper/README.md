# Laint Paper Draft

This directory contains an initial arXiv-style paper draft for laint.

## Current Shape

The draft is intentionally framed as a research/tool paper, not a product announcement. The strongest publishable angle is:

> Agent-oriented linting for generated JSX/TSX applications catches framework-specific web, mobile, and backend failures earlier than conventional build/type/runtime feedback.

## Before Submission

- Add real authors and affiliations.
- Decide whether this targets arXiv only, a workshop, or both.
- Run the prompt-to-code precision evaluation described in `main.tex`.
- Replace the evaluation-plan section with measured results.
- Add citations to relevant program-repair and LLM-code-generation work.
- Build the PDF from `main.tex` and inspect it before submission.

## Suggested Evaluation Data

- A prompt suite covering web, mobile, and backend app-building tasks.
- Generated JSX/TSX outputs from one or more LLMs.
- Laint findings for each generated output.
- Human labels for whether each finding is a valid, invalid, or ambiguous violation.
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
