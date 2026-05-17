# Laint Paper Draft

This directory contains an initial arXiv-style paper draft for laint.

## Current Shape

The draft is intentionally framed as a research/tool paper, not a product announcement. The strongest publishable angle is:

> Agent-oriented linting for generated JSX/TSX applications catches framework-specific web, mobile, and backend failures earlier than conventional build/type/runtime feedback.

## Before Submission

- Add real authors and affiliations.
- Decide whether this targets arXiv only, a workshop, or both.
- Run the empirical evaluation described in `main.tex`.
- Replace the evaluation-plan section with measured results.
- Add citations to relevant program-repair and LLM-code-generation work.
- Build the PDF from `main.tex` and inspect it before submission.

## Suggested Evaluation Data

- Generated app edit traces with and without the laint hook.
- TypeScript, framework build, web preview, mobile simulator/device preview, and runtime outcomes.
- Manual labels for whether each laint finding was a true defect.
- Repair iteration counts after lint feedback.
