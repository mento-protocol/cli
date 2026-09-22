# AGENTS.md

Rules for every agent working in this repository. Coordinator-owned: do not edit.

This repo is mento-cli. It is built by several agents in parallel, each in its own workspace
and branch, and every claim is verified by a gate before it merges. The rules below exist so
that parallel work merges cleanly and so that no mistake reaches production, a user, or a
credential.

## Read before you write
1. Your brief: `docs/plan/briefs/<task-id>.md`. It names the paths you own and how you will be
   judged.
2. `docs/plan/wps.json`: which task owns which paths, and what is coordinator-owned.
3. The project rules below, and whatever the brief lists under "Read first".

## The rules

**1. Stay inside your paths.** Change only files matching your task's `owned` globs in
`docs/plan/wps.json`. The `alwaysAllowed` entries there (lockfile, `docs/adr/DRAFT-*.md`) are always
fine. Never edit anything under `coordinatorOwned`: `AGENTS.md`, `.skein/**`,
`scripts/skein/**`, `docs/plan/**`, `.github/**`, the hooks, and the project's frozen paths. If
a shared file seems to need a change, that is a blocker to report, not an edit to make.

**2. Frozen paths are frozen.** The plan's `coordinatorOwned` list names the contract this
project builds against. If it lacks something you need, stop and report `BLOCKED` with the
exact change you propose. The coordinator applies it with a short ADR and tells running
workers to rebase.

**3. Never weaken a test to get green.** No `.skip`, `.only` or `.todo`. No `@ts-nocheck`,
no file-wide lint disables, no widened tolerances. Shared regression suites only grow; the
gate counts them. A failing test is information: fix the code or report the problem.

**4. Secrets.** Never commit `.env` or any credential. Never print, log, or put in an error
message a key, a token, a signing secret, or a user's personal data. Test data is invented.
The gate scans for committed keys; do not rely on it.

**5. Dependencies.** Add one only if your brief's work needs it, and name it in your hand-off.
Prefer what is already here. No install scripts from packages you cannot vouch for.

**6. Stay in scope.** Do what the brief says. Note improvements you spot in your hand-off
instead of making them. Do not refactor another task's code.

**7. Skills and workflows.** The coordinator uses whatever skills it likes; workers do not.
Do not invoke `/ship`, `/review`, `/qa`, or any workflow that merges, bumps versions, or opens
PRs on your behalf. Your gate is `scripts/skein/skein gate <task-id>` and nothing else.

**8. Do not poll GitHub.** Every agent shares API limits. No `gh pr checks --watch`, no loop
around `gh`. The local gate is your evidence; the coordinator watches CI.

## Project rules
**P1. `mento swap` moves real money.** Never run it without `--dry-run`, by hand or in a test.
Never create, fund, request or import a wallet key; tests use throwaway keys from
`viem/accounts` and never a keyfile from disk. A private key or keyfile path never appears in a
commit, a fixture, a log, or a hand-off.

**P2. Tests never depend on the network.** Every command talks to Celo through the SDK. A unit
test mocks the SDK (`@mento-protocol/mento-sdk`) or exercises the pure modules (`src/lib/format.ts`,
`src/lib/utils.ts`, `src/lib/errors.ts`, `src/lib/client.ts` resolution). A test that must reach
an RPC is an integration test: it skips itself with a printed reason when `MENTO_RPC_URL` is
unset, and CI never sets it.

**P3. Addresses and ABIs come from the SDK, never from memory.** This repo is the source of
truth for CLI behaviour only. Deployment addresses, ABIs and live chain state resolve through
`@mento-protocol/mento-sdk` (and, for a person with the checkout, the private
`../mento-master-context/.agents/mento-context/README.md` router). A worker in a fresh worktree
does not have that checkout: the brief inlines what a task needs, and a worker that finds itself
guessing a contract address reports `BLOCKED`.

**P4. Never publish.** `npm publish`, version bumps in `package.json`, and tags are
coordinator-only, through a PR. `prepack` runs `tsc`; do not make it do more.

**P5. `--json` output is a contract.** With `--json`, stdout carries exactly one JSON document
and nothing else; progress and warnings go to `stderr`. Human-readable output may change freely;
JSON field names may not without the brief saying so.


## Workflow
1. Read the brief and everything it lists under "Read first".
2. Work in small conventional commits (`feat(scope): …`, `fix(scope): …`, `test(scope): …`)
   on your branch only.
3. Before claiming done, run the gate and make it pass:
   ```bash
   scripts/skein/skein gate <task-id>
   ```
   It checks a clean tree, path ownership, committed secrets, test integrity, the project's
   invariants, then the standard commands, the e2e suite if configured, and your task's
   acceptance commands. The coordinator and CI run the same gate, so a claim it does not
   support will be rejected.
4. Push your branch and open a **draft** pull request. Names say what the work is and carry
   the task id:
   - **your branch** is `<type>/<slug>-<task-id>`, made for you at dispatch;
   - **the pull request title** is a conventional-commit subject with the id at the end:
     `fix(api): JSON 404 for unknown paths (CLI-01)`. It becomes the squashed commit on
     `main`, and the plan reads it to know the task merged.

   Never push to `main`, never merge, never force-push a branch that is not yours.
5. End your final message with exactly one envelope.

## Completion envelope
```text
CLI_WORKER_DONE
task: <task-id>
summary: <one-line outcome>
pr: <draft PR url>
files: <comma-separated top-level paths, or none>
checks: <the SKEIN_GATE_RESULT line, verbatim>
handoff: <what the next task or the reviewer needs to know, or none>
```
```text
CLI_WORKER_BLOCKED
task: <task-id>
reason: <specific blocker>
needs: <the decision, access, contract change or dependency required>
```
Report `BLOCKED` early rather than working around a problem. A precise blocker is a good
outcome; a silent workaround is not.

## Ambiguity
If the architecture or the contract is ambiguous or wrong, do not guess silently. Write
`docs/adr/DRAFT-<task-id>-<slug>.md` stating the context, the decision you took and its
consequences, and mention it in your hand-off. The coordinator numbers it at merge.

## Commands
```bash
npm ci --prefer-offline --no-audit --no-fund
# no standard commands detected: add typecheck/lint/test scripts
scripts/skein/skein gate <task-id>
scripts/skein/skein gate <task-id> --only boundary,secrets,test-integrity,invariants   # fast static checks
```
