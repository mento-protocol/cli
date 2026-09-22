# Working with a swarm on this repo

This repo is our sandbox for building software with several coding agents in parallel,
under more than one coordinator, with a gate deciding what merges. Nothing here is
load-bearing. The point is to learn the loop with two or more of us on the same board, and
to decide from real numbers whether to use it on the SDK and the frontend.

The tooling is [skein](https://github.com/bayological/skein). You will not type most of its
commands yourself: you talk to a coordinator session, and it runs them.

**First run, for calibration (2026-09-22):** one coordinator briefed CLI-00 (a test harness),
dispatched an Opus worker, and merged. The worker took 5m 42s, wrote 38 offline tests, passed
the gate on its own run, and flagged three places where the brief was wrong instead of
guessing. The gate and merge took the coordinator another five minutes.

## 1. Install, once per machine

| Need | How | Check |
|---|---|---|
| Superset desktop | https://superset.sh, sign in, accept the org invite; add `~/.superset/bin` to PATH | `superset auth whoami` |
| Claude Code | https://claude.com/claude-code, signed in | `claude --version` |
| `gh`, Node 24, `jq` | your package manager; `gh auth login` as yourself | `gh auth status` |
| skein | `git clone https://github.com/bayological/skein ~/.claude/skills/skein && ~/.claude/skills/skein/setup` | `skein --version` |
| your cap | `echo '{"maxAgents": 3}' > ~/.skein/config.json` | how many agents your laptop and seat can carry |

Restart Claude Code once so it loads the `/skein-*` skills. Codex is optional: without it,
cross-model reviews use a different Claude model. The Superset app must be running for its
CLI to work; it is a shim into the app.

## 2. Set up this repo, once

```bash
git clone git@github.com:mento-protocol/cli.git && cd cli
git config core.hooksPath scripts/githooks          # refuses pushes to main; coordinators merge
npm ci && npm run typecheck && npm test              # 38 tests, offline, about a second
superset projects create --local --name cli --import "$PWD"   # or add the folder in the app
skein doctor                                         # every line green
```

Then read `AGENTS.md` (the rules every worker follows, ten minutes). Skim
`docs/plan/COORDINATOR.md` so you know what your coordinator is doing on your behalf.

## 3. Start your coordinator

Open a Claude Code session **in this checkout** and paste the block from
`docs/plan/COORDINATOR-PROMPT.md`. Say:

> what's ready?

It runs `skein status` and `skein plan`: who holds what on the board, what is ready, and
which ready tasks overlap. From here on you talk; it runs the commands.

## 4. Plan a feature

This is the part that decides everything. A worker reads its brief and nothing else, in a
fresh worktree, with no way to ask you. The brief must be executable without a question.

Pick a suggested feature from `docs/plan/wps.json` (CLI-03 to CLI-06 are ideas; CLI-01 and
CLI-02 are small warm-ups), or bring your own. Say:

> let's brief CLI-03

The coordinator runs `/skein-brief`: it interrogates you (who is this for, what happens
today, what should happen, how will we know), reads the code and cites lines, then writes
`docs/plan/briefs/CLI-03.md` and the plan entry: the files the task may touch, the commands
that prove it done, whether it touches money. Expect two or three rounds; push back. When
you confirm, it commits and pushes.

Two things the first run taught about briefs:
- **Everything the brief tells the worker to create must be inside the task's owned files.**
  CLI-00's brief suggested a config file at a path the plan had not granted, and the worker
  correctly put it elsewhere and said so.
- **Name versions you have checked.** The brief named an old vitest major; the worker
  installed current and flagged it. Either is fine; a brief that is wrong costs a round.

A feature bigger than one worker gets split into tasks that own different files. That is
what lets two agents build at once.

## 5. Build it

> dispatch CLI-03

The coordinator claims the task on the board (a GitHub issue labelled `skein`, assigned to
you), creates a Superset workspace from today's main, waits for setup, launches a worker.
Watch it in the Superset sidebar under the `running` tag, or ask your coordinator "status".

When it reports DONE (it prints a `CLI_WORKER_DONE` envelope with the PR link and its gate
result):

> gate and merge CLI-03

The coordinator reruns the gate in the worker's worktree, reads the diff, runs a
cross-model review if the task is marked money, and squash-merges. The issue closes, the
workspace is deleted, the plan marks the task done.

## 6. Two of you at once

That is the exercise. While your worker builds CLI-03, the other person briefs and
dispatches CLI-04. The board is the lock: an assigned issue is not yours, and your
coordinator will refuse it. `skein plan` prints overlaps between ready tasks, so two tasks
that touch one file run in sequence. The repo cap is 6 agents across everyone.

Things that will happen, and are fine:

| You see | What it means | What to do |
|---|---|---|
| "claimed by @someone" on dispatch | they got there first | pick another task |
| a `CLI_WORKER_BLOCKED` envelope | the brief was ambiguous or needs a frozen file | fix the brief, push, `skein send CLI-03 "continue"`; or open a coordinator PR for the frozen change |
| the gate fails on `boundary` | the worker touched a file it does not own | ask it to revert, or fix the plan if the brief was wrong |
| the gate fails on anything else | never weaken it | ask the worker to fix, then gate again |
| "brief or plan differs from origin" | you have not pushed | the coordinator pushes with the override |
| main moved under a running worker | someone merged first | ask the worker to rebase before its gate |

## 7. Day to day vocabulary

You will mostly say these to your coordinator; the command in brackets is what it runs.

| Say | It runs |
|---|---|
| status / what's running | `skein status` |
| what's ready / show the plan | `skein plan` |
| brief CLI-0N | `/skein-brief` then `skein brief CLI-0N --check` |
| dispatch CLI-0N | `skein dispatch CLI-0N`, then `skein watch` |
| tell the worker to … | `skein send CLI-0N "…"` |
| gate CLI-0N | `skein gate CLI-0N` in its worktree |
| review CLI-0N | `skein review CLI-0N` (money tasks; read-only reviewer, posts to the PR) |
| merge CLI-0N | `skein merge CLI-0N` |

## 8. Report back

After your first merge, drop a note in the channel: how long the brief took and how many
rounds, what the worker got wrong, what the gate caught, the cost Claude Code shows for
the worker session (`/cost` in the worker's terminal before it is deleted). That is the data
we need.

## Without Superset

`export SKEIN_DRIVER=local` before starting your coordinator. Workers run as Claude Code
headless in git worktrees under `~/.skein/worktrees/`, and `skein status` reads their logs.
Everything else is identical.
