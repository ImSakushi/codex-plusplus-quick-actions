# Repository Guidelines

## Project Overview

This repository is a Codex++ tweak named `Quick Actions`. It adds custom workflow actions for Codex's Git panel.

Keep changes focused on the tweak. Avoid introducing a build system unless the task explicitly requires it.

For the shared Codex++ tweak development basics, consult `TWEAK_GUIDE.md` before changing tweak structure, manifest metadata, renderer UI patterns, settings controls, hot reload behavior, or DOM probing workflows.

## Coding Style

- Use CommonJS and plain JavaScript unless the existing code is intentionally changed.
- Keep UI classes consistent with Codex Tailwind/token-style classes.
- Use ASCII by default.
- Preserve local user edits and avoid unrelated refactors.

## Validation

Before finishing code changes, run the lightweight syntax checks that fit the files changed. For `index.cjs`, use:

```sh
node --check index.cjs
```
