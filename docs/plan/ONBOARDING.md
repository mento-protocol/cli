# Joining this project

For a person joining mento-cli with their own machine and their own agents. The team guide is
`SWARM.md` at the repo root; this page is the generic checklist behind it.

## 1. Your machine
- The agent CLIs you use: Claude Code, and Codex if you run cross-model reviews.
- `gh`, authenticated as yourself.
- Superset with this repo added as a project, if you use the Superset driver. Without it,
  set `"driver": {"type": "local"}` in your copy of the config or export `SKEIN_DRIVER=local`.
- The skein kit, for the skills and `skein init`/`upgrade`:
  ```bash
  git clone https://github.com/bayological/skein ~/.claude/skills/skein && ~/.claude/skills/skein/setup
  ```
  Day to day you need only the vendored copy in this repo: `scripts/skein/skein`.
- Your caps: `~/.skein/config.json` with `{"maxAgents": 3}` (or whatever your machine and
  seat can carry).

Then:
```bash
git clone <this repo> && cd <repo>
git config core.hooksPath scripts/githooks
npm ci --prefer-offline --no-audit --no-fund
# no standard commands detected: add typecheck/lint/test scripts
skein doctor
```

## 2. How work is organised
- **`docs/plan/wps.json`** is the map: each task's `owned` globs are the only files it may change. Two
  tasks never own one file at the same time.
- **`docs/plan/briefs/<task-id>.md`** is a task's specification: what to build, what to read first,
  how it will be judged.
- **The board** (github) is where claims live. Assign yourself before you dispatch or brief.
- **`docs/plan/COORDINATOR.md`** is the runbook for whoever is coordinating.
- **The gate** is `skein gate <task-id>`. CI runs the same script.

## 3. Your own coordinator
Paste `docs/plan/COORDINATOR-PROMPT.md` into a fresh session in your checkout. It spins up
agents, verifies them, reviews, merges, and keeps the record, the same as everyone else's.

## 4. The rules that matter most
- Never commit `.env`; never print a key.
- Never weaken a test to get green.
- Never push to `main`; the coordinator merges through `skein merge`.
- Frozen paths (`coordinatorOwned` in the plan) change only through a coordinator PR with an ADR.

## Mento specifics
- **This repo is the team's sandbox** for running several coordinators at once. Nothing here is
  load-bearing; the point is to see the loop (brief, dispatch, gate, review, merge) with two or
  more people coordinating on the same board. Break things; the gate will tell you.
- **Access:** write access to `mento-protocol/cli` (org membership is enough) and `gh auth login`
  as yourself. No secrets exist for this repo.
- **Superset:** add the repo as a project in the desktop app; `skein` resolves the project by
  path. Without Superset, `export SKEIN_DRIVER=local`: workers then run as Claude Code headless
  in git worktrees under `~/.skein/worktrees/`, and `skein status` reads their logs.
- **Your first act as a coordinator:** `skein plan` shows CLI-00 ready and CLI-01, CLI-02
  unbriefed on purpose. Dispatch CLI-00 if nobody holds it (the board says), or brief CLI-01
  with `/skein-brief` while someone else runs CLI-00. Two coordinators, one board, no owner.
- **The master-context router** (`../mento-master-context`) is not available to workers. A brief
  inlines what a task needs (AGENTS.md P3).
