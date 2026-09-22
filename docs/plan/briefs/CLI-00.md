# CLI-00: Test harness, so the gate can judge work

## Objective
Nothing in this repo can be verified yet. `package.json:8-12` has `build` (`tsc`), `dev`
(`tsx src/index.ts`) and `prepack`; there is no `typecheck`, no `test`, no test runner, and no
test file anywhere. `.skein/config.json` therefore runs only `npm run build` as its standard
check, which proves the code compiles and nothing more. Make the gate able to judge work: a
`typecheck` script, a real test runner with real tests over the pure modules, and the scripts
CI and every later task's `accept` will call. When this merges, the coordinator switches the
standard commands to `npm run typecheck` and `npm test`, and CLI-02 becomes dispatchable.

This task adds no product behaviour. `mento tokens`, `mento quote` and every other command
behave exactly as they do today.

## Read first
- `AGENTS.md`, all of it. P1 and P2 decide what a test here may do.
- `package.json` and `tsconfig.json` (`module: Node16`, `rootDir: ./src`, `include: src/**/*`).
  Tests must not end up in `dist/` and must not break `npm run build`.
- `src/lib/format.ts`: `formatAddress` (`:8`), `parseAmount` (`:16`), `formatTokenAmount`
  (`:26`), `output` (`:62`). Pure except `output`, which prints.
- `src/lib/client.ts:19-31`: `resolveChainId`, pure. `getMento` (`:37`) reaches the network:
  do not call it in a unit test.
- `src/lib/errors.ts`: `handleError` maps messages and calls `process.exit(1)` on every path.
  Testing it means stubbing `process.exit` and `console.error`.
- `src/lib/utils.ts`: `findToken` is not exported; `resolveTokenSync` reads the SDK's token
  cache. Test through `resolveTokenSync` with `getCachedTokens` mocked, or leave it for a
  later task and say so.
- `.github/workflows/skein-gate.yml`: CI runs `scripts/skein/skein gate --from-branch` on your
  PR, which runs the `standard` commands and then your `accept` commands.

## You own
- `package.json` (scripts and devDependencies only; `name`, `version`, `bin`, `files`,
  `dependencies`, `prepack` unchanged)
- `tsconfig.json`
- `vitest.config.ts` (new)
- `tests/**` (new)
- `.gitignore`

`package-lock.json` is always allowed. Nothing under `src/`: you test what is there and you
do not change it. If a test reveals a bug (there is at least one in `parseAmount`, see the
CLI-02 note in `docs/plan/wps.json`), let the test describe today's behaviour, leave the bug,
and name it in your hand-off. Fixing it is CLI-02.

## Hard rules for this task
- **No network, no keys.** Every test runs offline. Nothing imports `getMento` or constructs a
  wallet. (AGENTS.md P1, P2.)
- **No new runtime dependencies.** Everything you add is a `devDependency`: `vitest` and
  nothing else unless you name why in the hand-off.
- **`npm run build` still produces the same `dist/`**: `tsconfig.json` may gain an `exclude`
  for `tests`, but `rootDir`, `outDir` and `include` keep their meaning. Check `dist/` has no
  `tests/` directory after a build.
- **CI passes with no secrets.** There are none to set; keep it that way.

## Work
1. **Scripts.** In `package.json` add `"typecheck": "tsc --noEmit"` and `"test": "vitest run"`,
   plus `"test:watch": "vitest"`. Add `vitest` (current 3.x) as a devDependency with
   `npm install --save-dev`, so `package-lock.json` updates for that reason only.
2. **Config.** `vitest.config.ts`: `test.include: ["tests/**/*.test.ts"]`, node environment.
   Because `tsconfig.json` has `include: ["src/**/*"]`, either add `tests` to `include` with
   `rootDir` handling, or add a `tsconfig.test.json` that extends it; pick the one that keeps
   `npm run build` unchanged and `npm run typecheck` covering the tests too. Say which in the
   hand-off.
3. **Tests over the pure modules**, in `tests/`, one file per module, named by the module:
   - `format.test.ts`: `formatAddress` (short address returned unchanged, long address
     truncated with the default and a custom `chars`); `parseAmount` (`"1"`, `"1.5"`,
     `"0.000001"` at 18 and 6 decimals, excess fractional digits truncated, and one test
     documenting what `"abc"` does today); `formatTokenAmount` (`"0"`, values below one unit,
     thousands separators, `displayDecimals` 0 and default, bigint and string input).
   - `client.test.ts`: `resolveChainId` for `celo`, `CELO`, `celo-sepolia`, a numeric string,
     and the error for an unknown name.
   - `errors.test.ts`: `handleError` for at least four message classes (market closed,
     insufficient, no route, network) and the default, asserting the message printed and that
     `process.exit(1)` was called, with both stubbed via `vi.spyOn`.
   Aim for roughly 25 tests. Clear over clever: these are the reference for what a test in
   this repo looks like.
4. **Ignore.** `.gitignore` gains `coverage/` if you enable coverage; nothing else changes.
5. **Run the gate**: `scripts/skein/skein gate CLI-00`. Its `standard` step runs
   `npm run build`; its `accept` step runs `npm run typecheck` and `npm test`.

## What "done" looks like
`scripts/skein/skein gate CLI-00` ends `status=PASS`. `npm test` runs your tests offline in
under ten seconds. `npm run build` still succeeds and `dist/` contains no tests. A gate that
goes green because the suite is empty is a failed task, not a passed one: report how many
tests run, how long the suite takes, and anything in the existing code that looked wrong and
that you left alone.

## Acceptance
`scripts/skein/skein gate CLI-00`, whose `accept` step runs `npm run typecheck` and `npm test`.
The coordinator reads the diff of `package.json` and `tsconfig.json`.

Be direct and economical. Do not poll GitHub. Finish with the completion envelope from
`AGENTS.md`.
