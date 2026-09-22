# Try the flock: build a feature on this repo with a swarm

This repo is our sandbox for building with several coding agents in parallel, under more
than one coordinator, with a gate deciding what merges. Nothing here is load-bearing. The
goal is that each of us runs a coordinator, plans a feature, and builds it with agents while
someone else does the same on the same board. Budget about an hour for setup and an
afternoon for the first feature.

## 1. Install (once per machine)

1. **Superset** desktop from https://superset.sh, sign in, and accept the invite to the org.
   Its CLI is bundled: add `~/.superset/bin` to your PATH. Then `superset auth login` in a
   terminal and `superset auth whoami` to confirm. The app must be running for the CLI to
   work.
2. **Claude Code** (https://claude.com/claude-code), signed in. Codex is optional; without it,
   cross-model reviews fall back to a different Claude model.
3. **`gh`** authenticated as yourself (`gh auth login`), **Node 24**, **`jq`**.
4. **skein**, the kit that runs the loop:
   ```bash
   git clone https://github.com/bayological/skein ~/.claude/skills/skein
   ~/.claude/skills/skein/setup
   echo '{"maxAgents": 3}' > ~/.skein/config.json     # how many agents your machine and seat can carry
   ```
   Restart Claude Code once so it loads the `/skein-*` skills.

## 2. Set up this repo (once)

```bash
git clone git@github.com:mento-protocol/cli.git && cd cli
git config core.hooksPath scripts/githooks      # refuses pushes to main; the coordinator merges
npm ci
superset projects create --local --name cli --import "$PWD"   # or add the folder in the app
skein doctor                                    # every line should be green
```
Read `AGENTS.md` (the rules workers follow, ten minutes) and skim `docs/plan/COORDINATOR.md`.

## 3. Start your coordinator

Open a Claude Code session **in this checkout** and paste the block from
`docs/plan/COORDINATOR-PROMPT.md`. Then say: **"what's ready?"**

It runs `skein status` and `skein plan` and tells you what is claimed, by whom, and what is
ready to dispatch. From here on you talk; it runs the commands. You never need to type a
`skein` or `superset` command yourself, though you can.

## 4. Plan a feature (the part that matters most)

Pick something from the "Suggested features" list in `docs/plan/wps.json` (the tasks with
`"brief": null`), or bring your own. Tell your coordinator:

> "Let's brief CLI-03."

It runs `/skein-brief`: it will interrogate you (who is this for, what happens today, what
should happen, how will we know it is done), read the code and cite lines, then write
`docs/plan/briefs/CLI-03.md` and the plan entry (owned files, acceptance commands, whether
it touches money). Push back on it. A brief is good when a worker in a fresh worktree, who
cannot ask you anything, could build it without a single question. Expect two or three
rounds. When you confirm, it commits and pushes.

If your feature is bigger than one worker, ask it to split the feature into tasks that own
different files. That is what lets two agents build at once.

## 5. Build it

> "Dispatch CLI-03."

The coordinator claims the task on the board (a GitHub issue appears, assigned to you),
creates a Superset workspace, waits for setup, and launches a worker. You can watch the
worker in the Superset sidebar under the `running` tag. When it reports done:

> "Gate and merge CLI-03."

The coordinator runs the gate in the worker's worktree, reads the diff, runs a cross-model
review if the task is marked money, and squash-merges. The issue closes, the workspace is
deleted, the plan marks the task done.

## 6. Two of you at once

That is the point of the exercise. While your worker builds CLI-03, the other person briefs
and dispatches CLI-04. The board (GitHub issues labelled `skein`) is the lock: an assigned
issue is not yours. `skein plan` shows ownership overlaps between ready tasks, so two tasks
that touch the same file run in sequence, not in parallel. The repo cap is 6 agents total.

Things that will happen, and are fine:
- Your coordinator refuses to dispatch a task someone else holds. Pick another.
- A worker reports BLOCKED. Read its envelope; usually the brief was ambiguous. Fix the
  brief, push, and resume it (`skein send`).
- The gate fails. Never weaken it; ask the worker to fix.
- Merging main moves under a running worker. Its gate diffs against origin/main; the
  coordinator asks it to rebase.

## 7. What to report back

After your first merge, note in the team channel: how long the brief took, how many rounds,
what the worker got wrong, what the gate caught, and what cost the run showed (Claude Code
prints it). That is the data we need to decide how to use this on the SDK and the frontend.

## Without Superset

`export SKEIN_DRIVER=local` before starting your coordinator. Workers then run as Claude Code
headless in git worktrees under `~/.skein/worktrees/`, and `skein status` reads their logs.
Everything else is the same.
