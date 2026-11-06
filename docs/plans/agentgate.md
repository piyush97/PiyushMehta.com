# agentgate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A zero-dependency GitHub Action and CLI that fails a PR when an AI coding agent weakens tests, edits guardrail files, escalates workflow permissions, adds dependencies, or silences scanners.

**Architecture:** Git produces the PR diff (`base...head`). Five pure rule functions read the parsed diff and return findings. An engine applies severities from config loaded **from the base commit**, then the CLI prints Markdown/JSON and the Action writes a step summary, annotations, and an exit code. Semgrep and gitleaks stay separate jobs; agentgate covers what they don't (the post's "Job 3: test integrity" and "Lock the files that define the rules").

**Tech Stack:** Node 24 (native TS type stripping, `path.matchesGlob`, `node:test`), TypeScript compiled with `tsc` to `dist/` for the Action, no runtime dependencies.

**Spec:** `src/content/blog/ai-coding-agent-security-gate/index.mdx` in the PiyushMehta.com repo (sections "The gate", "Job 3: test integrity", "Lock the files that define the rules", "Where this gate stops helping").

## Global Constraints

- Repo: `~/Projects/agentgate`, GitHub `piyush97/agentgate`. npm name `agentgate` is taken → publish as `@piyush97/agentgate`, bin `agentgate`.
- `"engines": { "node": ">=24.2" }` (needed for `import.meta.main`); Action `runs.using: node24`, `runs.main: dist/action.js`.
- Zero runtime `dependencies`. devDependencies: `typescript` (>=5.8 for `erasableSyntaxOnly`) and `@types/node@^24` (types for `node:*`, `process`, `import.meta.main`; typecheck fails without it).
- Source imports use `.ts` extensions; `tsconfig.json` sets `types: ["node"]`, `rewriteRelativeImportExtensions`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `strict`, `module: nodenext`, `target: es2024`, `rootDir: src`, `outDir: dist`. No enums, namespaces, or parameter properties.
- Tests: `node --test 'tests/**/*.test.ts'` with `node:assert/strict`.
- Exit codes everywhere: `0` pass or warn, `1` block, `2` usage/environment error.
- Config file: `.agentgate.json`. The Action reads it from the PR **base** commit, never the head.
- Override label default: `agentgate-approved`. Accepted only when applied by a human (`actor.type === "User"`) who is not the PR author.
- Action permissions: `contents: read`, `pull-requests: read`. It never writes to the PR.
- All git calls use `execFileSync('git', args)`, never a shell string.
- Commits via GitButler: first `but commit -b agentgate-v1 -m "..."`, then `but commit -m "..."`. No co-author lines.
- Do not push, tag, publish to npm, or list on the Marketplace without asking Piyush first.

## Review Focus

1. **Agent edits `.agentgate.json` in the PR to turn rules off** → head config ignored; config comes from base, and the edit itself raises `guardrail-edited`. Tested in Task 3 and Task 8.
2. **Agent or PR author adds the override label itself** → override ignored, summary says why. Tested in Task 9.
3. **Shallow checkout (`fetch-depth: 1`) so base SHA is missing** → exit 2 with "fetch-depth: 0" in the message, never a silent pass. Tested in Task 2 and Task 8.
4. **Test file deleted, or renamed out of a test path** → block, even with no `.skip` added. Tested in Task 4.
5. **Human applies the override label, then the agent pushes more commits** → the stale label must not approve unreviewed code. On a `synchronize` event the override is ignored until a human removes and re-applies the label. Tested in Task 9.
6. **Agent edits the workflow that runs agentgate** (deletes the job, or swaps it for `run: exit 0` under the same job name). agentgate can't stop this: on `pull_request` the workflow file comes from the PR head. The defense is branch protection (required check plus required Code Owner review on `.github/**`), and for orgs a ruleset-required workflow. The README must say this (Task 10).

---

## File Structure

```
agentgate/
  package.json              bin, scripts, engines, files
  tsconfig.json
  action.yml                Action metadata (Task 9)
  .agentgate.json           dogfood config (Task 10)
  docs/plan.md              copy of this plan (Task 1)
  src/
    types.ts                shared types (Task 1)
    diff.ts                 parseHunks: patch text → added/removed lines (Task 1)
    git.ts                  refs, changed files, per-file diff, show (Task 2)
    config.ts               defaults, validation, merge, load from base (Task 3)
    rules/
      test-weakened.ts      (Task 4)
      guardrail-edited.ts   (Task 5)
      workflow-escalation.ts (Task 5)
      dependency-added.ts   (Task 6)
      suppression-added.ts  (Task 6)
      index.ts              ALL_RULES (Task 7)
    engine.ts               runGate, verdictOf, downgrade (Task 7)
    report.ts               toMarkdown, toJson, toAnnotations (Task 7)
    collect.ts              git → FileDiff[] + RuleContext (Task 8)
    cli.ts                  `agentgate check` (Task 8)
    action.ts               Action entry, override check (Task 9)
  tests/
    helpers/repo.ts         temp git repo builder (Task 2)
    helpers/fd.ts           FileDiff literal builder (Task 4)
    **/*.test.ts
  examples/agent-pr-gate.yml  agentgate + Semgrep + gitleaks (Task 10)
  dist/                     committed tsc output for the Action (Task 9)
```

---

### Task 1: Scaffold, shared types, hunk parser

**Files:**

- Create: `package.json`, `tsconfig.json`, `.gitignore` (`node_modules/`), `docs/plan.md`, `src/types.ts`, `src/diff.ts`
- Test: `tests/diff.test.ts`

**Interfaces:**

- Produces (`src/types.ts`):
  ```ts
  export type Severity = 'block' | 'warn';
  export type RuleId =
    | 'test-weakened'
    | 'guardrail-edited'
    | 'workflow-escalation'
    | 'dependency-added'
    | 'suppression-added';
  export interface DiffLine {
    line: number;
    text: string;
  } // new-file line for added, old-file line for removed
  export interface FileDiff {
    path: string;
    oldPath: string | null;
    status: 'added' | 'deleted' | 'modified' | 'renamed';
    binary: boolean;
    added: DiffLine[];
    removed: DiffLine[];
  }
  export interface RawFinding {
    rule: RuleId;
    file: string;
    line?: number;
    message: string;
  }
  export interface Finding extends RawFinding {
    severity: Severity;
  }
  export interface Config {
    testGlobs: string[];
    protectedPaths: string[];
    overrideLabel: string;
    rules: Record<RuleId, Severity | 'off'>;
  }
  export interface RuleContext {
    config: Config;
    readFile(ref: 'base' | 'head', path: string): string | null;
  }
  export interface Rule {
    id: RuleId;
    check(files: FileDiff[], ctx: RuleContext): RawFinding[];
  }
  export class GateError extends Error {} // usage/environment errors → exit 2
  ```
- Produces (`src/diff.ts`): `parseHunks(patch: string): { binary: boolean; added: DiffLine[]; removed: DiffLine[] }`

- [ ] **Step 1: Init repo and tooling**

```bash
mkdir -p ~/Projects/agentgate/docs && cd ~/Projects/agentgate
cp ~/Projects/PiyushMehta.com/docs/plans/agentgate.md docs/plan.md
but setup --init
npm init -y && npm i -D typescript @types/node@^24
```

Set `package.json`: `"name": "@piyush97/agentgate"`, `"type": "module"`, `"bin": { "agentgate": "dist/cli.js" }`, `"files": ["dist", "action.yml"]`, `"engines": { "node": ">=24.2" }`, scripts `"test": "node --test 'tests/**/*.test.ts'"`, `"build": "tsc"`, `"typecheck": "tsc --noEmit"`. Write `tsconfig.json` per Global Constraints (`include: ["src"]`).

- [ ] **Step 2: Write failing tests**

```ts
// tests/diff.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHunks } from '../src/diff.ts';

test('tracks old and new line numbers per hunk', () => {
  const patch = [
    'diff --git a/a.ts b/a.ts',
    '--- a/a.ts',
    '+++ b/a.ts',
    '@@ -3,2 +3 @@',
    '-  expect(x).toBe(1);',
    '-  expect(y).toBe(2);',
    '+  expect(x).toBeTruthy();',
    '@@ -10,0 +10,1 @@',
    '+it.skip("slow", () => {});',
  ].join('\n');
  assert.deepEqual(parseHunks(patch), {
    binary: false,
    removed: [
      { line: 3, text: '  expect(x).toBe(1);' },
      { line: 4, text: '  expect(y).toBe(2);' },
    ],
    added: [
      { line: 3, text: '  expect(x).toBeTruthy();' },
      { line: 10, text: 'it.skip("slow", () => {});' },
    ],
  });
});

test('ignores "\\ No newline at end of file" markers', () => {
  const patch = [
    '--- a/x',
    '+++ b/x',
    '@@ -1 +1 @@',
    '-a',
    '\\ No newline at end of file',
    '+b',
    '\\ No newline at end of file',
  ].join('\n');
  const r = parseHunks(patch);
  assert.deepEqual(r.removed, [{ line: 1, text: 'a' }]);
  assert.deepEqual(r.added, [{ line: 1, text: 'b' }]);
});

test('flags binary patches with no lines', () => {
  assert.deepEqual(parseHunks('Binary files a/logo.png and b/logo.png differ\n'), {
    binary: true,
    added: [],
    removed: [],
  });
});

test('"---"/"+++" content lines inside a hunk are content, not headers', () => {
  const patch = [
    '--- a/x.md',
    '+++ b/x.md',
    '@@ -1 +1,2 @@',
    '-old',
    '+++ not a header',
    '+--- also content',
  ].join('\n');
  assert.equal(parseHunks(patch).added.length, 2);
});
```

- [ ] **Step 3: Run, expect FAIL** — `npm test` → `Cannot find module '../src/diff.ts'`.

- [ ] **Step 4: Implement `types.ts` and `parseHunks`**

Line state machine: skip every line before the first `@@`. On `^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@` set `oldLine`, `newLine`. Inside a hunk: `-` → removed at `oldLine++`; `+` → added at `newLine++`; `\` → skip; ` ` → both++; `diff --git` → leave hunk mode. `binary = /^Binary files .* differ$/m.test(patch)`.

- [ ] **Step 5: Run, expect PASS** — `npm test && npm run typecheck`.

- [ ] **Step 6: Commit** — `but commit -b agentgate-v1 -m "Scaffold agentgate with shared types and hunk parser"`

---

### Task 2: Git adapter

**Files:**

- Create: `src/git.ts`, `tests/helpers/repo.ts`
- Test: `tests/git.test.ts`

**Interfaces:**

- Consumes: `parseHunks`, `FileDiff`, `GateError` (Task 1)
- Produces (`src/git.ts`):
  ```ts
  export interface Git {
    resolve(ref: string): string; // full SHA; GateError if missing
    changes(base: string, head: string): FileDiff[]; // status/paths + parsed lines
    show(ref: string, path: string): string | null; // null when path absent at ref
  }
  export function createGit(cwd: string): Git;
  ```
- Produces (`tests/helpers/repo.ts`): `makeRepo(): { dir: string; write(path: string, content: string | Buffer): void; rm(path: string): void; commit(msg: string): string; git(...args: string[]): string }`

- [ ] **Step 1: Write the helper** — `mkdtempSync` + `git init -q`, local `user.name`/`user.email`; `write` creates parent dirs; `commit` runs `git add -A`, `git commit -qm`, returns `git rev-parse HEAD`.

- [ ] **Step 2: Write failing tests**

```ts
// tests/git.test.ts
test('changes() reports added, modified, deleted, renamed; paths with spaces and unicode', () => {
  const r = makeRepo();
  r.write('src/keep.ts', 'a\n');
  r.write('tests/old name.test.ts', 'expect(1).toBe(1)\n'.repeat(5));
  r.write('gone.ts', 'x\n');
  const base = r.commit('base');
  r.write('src/keep.ts', 'a\nb\n');
  r.write('docs/ünï cødé.md', 'hi\n');
  r.rm('gone.ts');
  r.git('mv', 'tests/old name.test.ts', 'tests/new name.test.ts');
  const head = r.commit('head');
  const byPath = Object.fromEntries(
    createGit(r.dir)
      .changes(base, head)
      .map((f) => [f.path, f]),
  );
  assert.equal(byPath['src/keep.ts'].status, 'modified');
  assert.deepEqual(byPath['src/keep.ts'].added, [{ line: 2, text: 'b' }]);
  assert.equal(byPath['docs/ünï cødé.md'].status, 'added');
  assert.equal(byPath['gone.ts'].status, 'deleted');
  assert.equal(byPath['tests/new name.test.ts'].status, 'renamed');
  assert.equal(byPath['tests/new name.test.ts'].oldPath, 'tests/old name.test.ts');
});

test('binary files are marked binary with no lines', () => {
  const r = makeRepo();
  r.write('a.txt', 'a\n');
  const base = r.commit('b');
  r.write('logo.png', Buffer.from([0x89, 0x50, 0x00, 0x01, 0x00]));
  const head = r.commit('h');
  const [f] = createGit(r.dir).changes(base, head);
  assert.equal(f.binary, true);
  assert.deepEqual(f.added, []);
});

test('resolve() on a missing SHA throws GateError mentioning fetch-depth: 0', () => {
  const r = makeRepo();
  r.write('a', 'a\n');
  r.commit('b');
  assert.throws(
    () => createGit(r.dir).resolve('0123456789abcdef0123456789abcdef01234567'),
    (e: unknown) => e instanceof GateError && /fetch-depth: 0/.test(e.message),
  );
});

test('show() returns content at ref and null when absent', () => {
  const r = makeRepo();
  r.write('.agentgate.json', '{"a":1}');
  const base = r.commit('b');
  const g = createGit(r.dir);
  assert.equal(g.show(base, '.agentgate.json'), '{"a":1}');
  assert.equal(g.show(base, 'nope.json'), null);
});
```

- [ ] **Step 3: Run, expect FAIL** — `npm test`.

- [ ] **Step 4: Implement `createGit`** (`encoding: 'utf8'`, `maxBuffer: 64 MiB`)
  - `resolve`: `git rev-parse --verify --quiet <ref>^{commit}`; failure → `GateError(\`Cannot find commit ${ref}. Use actions/checkout with fetch-depth: 0.\`)`.
  - `changes`: list from `git -c core.quotePath=false diff --name-status -z -M <base>...<head>` (NUL-split; `R<score>` takes two paths, others one; `A/M/D/R/T` → status, `T` → modified). Per file: `git diff --no-color --no-ext-diff --unified=0 -M <base>...<head> -- <oldPath?> <path>` → `parseHunks`. Paths come from `-z` output, so spaces and unicode never need unquoting.
  - `show`: `git show <ref>:<path>`; non-zero exit → `null`.

- [ ] **Step 5: Run, expect PASS.**

- [ ] **Step 6: Commit** — `but commit -m "Add git adapter for PR diffs"`

---

### Task 3: Config

**Files:**

- Create: `src/config.ts`
- Test: `tests/config.test.ts`

**Interfaces:**

- Consumes: `Config`, `GateError`, `Git` (Tasks 1-2)
- Produces:
  ```ts
  export const DEFAULT_CONFIG: Config;
  export function parseConfig(json: string, source: string): Config; // merged over defaults; GateError on invalid
  export function loadConfig(git: Git, baseSha: string, path?: string): Config; // default '.agentgate.json', read at base; defaults when absent; passes source `${path}@${baseSha.slice(0, 7)}` to parseConfig
  ```

Defaults (exact):

```ts
testGlobs: ['**/*.test.*', '**/*.spec.*', '**/__tests__/**', '**/test/**', '**/tests/**', '**/*_test.go', '**/test_*.py', '**/*_test.py'],
protectedPaths: ['.github/**', '**/CODEOWNERS', '.agentgate.json', '**/AGENTS.md', '**/CLAUDE.md', '.cursor/**',
  '.semgrepignore', '.semgrep.yml', '.gitleaks.toml', '.gitleaksignore', '**/.npmrc'],
overrideLabel: 'agentgate-approved',
rules: { 'test-weakened': 'block', 'guardrail-edited': 'block', 'workflow-escalation': 'block',
  'dependency-added': 'warn', 'suppression-added': 'warn' },
```

Merge: user `protectedPaths` are **appended** (users add `src/auth/**`, `src/monitoring/**`; they cannot drop `.agentgate.json` or `.github/**`). `testGlobs` and `overrideLabel` replace. `rules` merge per key. Unknown top-level keys → GateError (catches typos). Hand-written validation, no schema lib.

- [ ] **Step 1: Write failing tests**

```ts
test('absent config file → defaults', () => {
  const r = makeRepo();
  r.write('a', 'a\n');
  const base = r.commit('b');
  assert.deepEqual(loadConfig(createGit(r.dir), base), DEFAULT_CONFIG);
});

test('config is read from base, not head', () => {
  const r = makeRepo();
  r.write('.agentgate.json', JSON.stringify({ rules: { 'test-weakened': 'block' } }));
  const base = r.commit('b');
  r.write('.agentgate.json', JSON.stringify({ rules: { 'test-weakened': 'off' } }));
  r.commit('agent disables rule');
  assert.equal(loadConfig(createGit(r.dir), base).rules['test-weakened'], 'block');
});

test('user protectedPaths append to defaults', () => {
  const c = parseConfig('{"protectedPaths":["src/auth/**"]}', 'x');
  assert.ok(c.protectedPaths.includes('.agentgate.json'));
  assert.ok(c.protectedPaths.includes('src/auth/**'));
});

test('invalid JSON, unknown key/rule, bad severity, wrong type → GateError naming the source', () => {
  for (const bad of [
    '{',
    '{"rulez":{}}',
    '{"rules":{"nope":"warn"}}',
    '{"rules":{"test-weakened":"fatal"}}',
    '{"testGlobs":"*.ts"}',
  ])
    assert.throws(
      () => parseConfig(bad, '.agentgate.json@abc123'),
      (e: unknown) => e instanceof GateError && e.message.includes('.agentgate.json@abc123'),
    );
});
```

- [ ] **Step 2: Run, expect FAIL.** · **Step 3: Implement.** · **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit** — `but commit -m "Add config loaded from the PR base commit"`

---

### Task 4: Rule `test-weakened`

**Files:**

- Create: `src/rules/test-weakened.ts`, `tests/helpers/fd.ts`
- Test: `tests/rules/test-weakened.test.ts`

**Interfaces:**

- Consumes: `Rule`, `FileDiff`, `RuleContext` (Task 1); `DEFAULT_CONFIG` (Task 3)
- Produces:
  - `export const testWeakened: Rule` (id `'test-weakened'`)
  - `export function isTestPath(path: string, globs: string[]): boolean` (`path.matchesGlob` against each glob)
  - `tests/helpers/fd.ts`: `fd(path: string, o?: { status?: FileDiff['status']; oldPath?: string; binary?: boolean; added?: (string | [number, string])[]; removed?: (string | [number, string])[] }): FileDiff`. Bare strings get `line = index + 1`; default status `'modified'`.

Patterns (exact):

```ts
const SKIP =
  /\b(?:it|test|describe)\.(?:skip|only|todo)\s*\(|\b(?:xit|xtest|xdescribe)\s*\(|@pytest\.mark\.(?:skip|xfail)|@unittest\.skip|\bt\.Skip(?:Now|f)?\s*\(|@Disabled\b|@Ignore\b/;
const ASSERT =
  /\b(?:expect|assert\w*)\s*[.(]|\bself\.assert\w+\s*\(|\bt\.(?:Error|Errorf|Fatal|Fatalf|Fail|FailNow)\s*\(|\brequire\.\w+\s*\(/;
```

Findings, in this order:

1. Deleted file at a test path → `"Test file deleted"`.
2. Renamed from a test path to a non-test path → `"Test file moved out of test paths: <old> → <new>"`.
3. Each added `SKIP` line in a test path → that line, `"Test disabled or focused: <trimmed line>"`.
4. Over non-deleted test-path files: `net = Σadded(ASSERT) − Σremoved(ASSERT)`. If `net < 0` → one finding on the file with the largest per-file loss: `"Net <n> assertion(s) removed across test files"` (`n = -net`). Summing across files lets assertions move between files without a false positive.

- [ ] **Step 1: Write failing tests**

```ts
const ctx = { config: DEFAULT_CONFIG, readFile: () => null };
test('deleted test file blocks', () => {
  assert.deepEqual(
    testWeakened
      .check([fd('src/a.test.ts', { status: 'deleted', removed: ['expect(1)'] })], ctx)
      .map((f) => f.message),
    ['Test file deleted'],
  );
});
test('renamed out of test paths', () => {
  assert.match(
    testWeakened.check([fd('src/a.ts', { status: 'renamed', oldPath: 'src/a.test.ts' })], ctx)[0]
      .message,
    /moved out of test paths/,
  );
});
test('.skip/.only/xit/pytest skip flagged with line numbers', () => {
  const out = testWeakened.check(
    [
      fd('tests/x.test.ts', {
        added: [
          [7, 'it.skip("a", () => {})'],
          [9, 'describe.only("b", f)'],
          [11, 'xit("c")'],
        ],
      }),
      fd('tests/test_y.py', { added: [[3, '@pytest.mark.skip(reason="flaky")']] }),
    ],
    ctx,
  );
  assert.deepEqual(
    out.map((f) => f.line),
    [7, 9, 11, 3],
  );
});
test('net assertion loss flagged once; moved assertions are not', () => {
  const lost = testWeakened.check(
    [
      fd('a.test.ts', {
        removed: ['expect(a).toBe(1)', 'expect(b).toBe(2)'],
        added: ['expect(a).toBeTruthy()'],
      }),
    ],
    ctx,
  );
  assert.deepEqual(
    lost.map((f) => f.message),
    ['Net 1 assertion(s) removed across test files'],
  );
  const moved = testWeakened.check(
    [
      fd('a.test.ts', { removed: ['expect(a).toBe(1)'] }),
      fd('b.test.ts', { added: ['expect(a).toBe(1)'] }),
    ],
    ctx,
  );
  assert.deepEqual(moved, []);
});
test('skip strings outside test paths are ignored', () => {
  assert.deepEqual(
    testWeakened.check([fd('docs/testing.md', { added: ['use it.skip( sparingly'] })], ctx),
    [],
  );
});
```

- [ ] **Step 2: Run, expect FAIL.** · **Step 3: Implement.** · **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit** — `but commit -m "Add test-weakened rule"`

---

### Task 5: Rules `guardrail-edited` and `workflow-escalation`

**Files:**

- Create: `src/rules/guardrail-edited.ts`, `src/rules/workflow-escalation.ts`
- Test: `tests/rules/guardrail-edited.test.ts`, `tests/rules/workflow-escalation.test.ts`

**Interfaces:**

- Consumes: `fd` (Task 4), `parseConfig`, `DEFAULT_CONFIG` (Task 3)
- Produces: `export const guardrailEdited: Rule`, `export const workflowEscalation: Rule`

`guardrail-edited`: one finding per file whose `path` or `oldPath` matches any `protectedPaths` glob: `"Protected path changed (<status>): needs human review"`. No line.

`workflow-escalation`: files matching `.github/workflows/*.yml` or `.github/workflows/*.yaml`, added lines only, one finding per matching line (first matching pattern wins). Patterns → messages (exact):

```ts
[/\bpull_request_target\b/, 'pull_request_target runs with a write token and secrets'],
[/permissions:\s*write-all/, 'write-all permissions'],
[/^\s*(?:contents|id-token|actions|packages|pull-requests|issues|deployments|security-events|statuses|checks|attestations):\s*write\b/, 'write permission granted'],
[/\$\{\{\s*secrets\./, 'secret referenced'],
[/\$\{\{\s*github\.(?:head_ref|event\.[\w.]*\.(?:title|body|ref|label|name|email|message))\b/, 'untrusted input interpolated into workflow'],
[/^\s*-?\s*uses:\s*(?!\.\/|docker:\/\/)[^@\s#]+@(?![0-9a-f]{40}\b)\S+/, 'action not pinned to a full commit SHA'],
```

- [ ] **Step 1: Write failing tests**

```ts
test('guardrail: CODEOWNERS, workflow, config, nested AGENTS.md, user path, rename from protected path', () => {
  const ctx = {
    config: parseConfig('{"protectedPaths":["src/monitoring/**"]}', 't'),
    readFile: () => null,
  };
  const out = guardrailEdited.check(
    [
      fd('.github/CODEOWNERS'),
      fd('.github/workflows/ci.yml'),
      fd('.agentgate.json'),
      fd('packages/api/AGENTS.md'),
      fd('src/monitoring/alerts.ts'),
      fd('src/x.ts', { status: 'renamed', oldPath: '.github/workflows/gate.yml' }),
      fd('src/app.ts'),
    ],
    ctx,
  );
  assert.deepEqual(
    out.map((f) => f.file),
    [
      '.github/CODEOWNERS',
      '.github/workflows/ci.yml',
      '.agentgate.json',
      'packages/api/AGENTS.md',
      'src/monitoring/alerts.ts',
      'src/x.ts',
    ],
  );
});

test('workflow escalation patterns', () => {
  const ctx = { config: DEFAULT_CONFIG, readFile: () => null };
  const out = workflowEscalation.check(
    [
      fd('.github/workflows/ci.yml', {
        added: [
          [3, 'on: pull_request_target'],
          [6, '  contents: write'],
          [9, '      TOKEN: ${{ secrets.NPM_TOKEN }}'],
          [12, '        run: echo "${{ github.event.pull_request.title }}"'],
          [15, '      - uses: actions/checkout@v5'],
          [16, '      - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8'],
          [17, '      - uses: ./.github/actions/local'],
          [18, '  contents: read'],
        ],
      }),
    ],
    ctx,
  );
  assert.deepEqual(
    out.map((f) => f.line),
    [3, 6, 9, 12, 15],
  );
});

test('workflow rule ignores non-workflow files and removed lines', () => {
  const ctx = { config: DEFAULT_CONFIG, readFile: () => null };
  assert.deepEqual(
    workflowEscalation.check(
      [
        fd('docs/ci.md', { added: ['contents: write'] }),
        fd('.github/workflows/ci.yml', { removed: ['contents: write'] }),
      ],
      ctx,
    ),
    [],
  );
});
```

- [ ] **Step 2: Run, expect FAIL.** · **Step 3: Implement.** · **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit** — `but commit -m "Add guardrail-edited and workflow-escalation rules"`

---

### Task 6: Rules `dependency-added` and `suppression-added`

**Files:**

- Create: `src/rules/dependency-added.ts`, `src/rules/suppression-added.ts`
- Test: `tests/rules/dependency-added.test.ts`, `tests/rules/suppression-added.test.ts`

**Interfaces:**

- Consumes: `RuleContext.readFile(ref, path)` (Task 1), `fd` (Task 4)
- Produces: `export const dependencyAdded: Rule`, `export const suppressionAdded: Rule`

`dependency-added`:

- `**/package.json` (skip deleted): parse base (at `oldPath ?? path`) and head via `ctx.readFile` (base `null` → `{}`). For `dependencies`, `devDependencies`, `optionalDependencies`, `peerDependencies`: names in head but not base → `"New dependency: <name>@<range> (<field>)"`. Scripts `preinstall`, `install`, `postinstall`, `prepare` added or changed → `"Install lifecycle script changed: <name>"`. Unparseable head → single `"package.json is not valid JSON"`; never throw.
- `**/requirements*.txt`: added lines; strip `#` comments and whitespace; skip blanks and lines starting `-`. Name = text before the first of `=<>~![; `, lowercased. Removed lines go through the same parsing. Any added name not among the removed names → `"New dependency: <stripped line>"` at that line.

`suppression-added`: any non-binary file, added lines matching

```ts
/\bnosemgrep\b|eslint-disable|@ts-(?:ignore|nocheck|expect-error)|#\s*noqa\b|#\s*type:\s*ignore|gitleaks:allow|\bNOSONAR\b|#\s*nosec\b|\/\/\s*nolint\b|(?:istanbul|c8|v8)\s+ignore|pragma:\s*allowlist\s+secret/;
```

→ `"Scanner or type check silenced: <trimmed line, max 120 chars>"`.

- [ ] **Step 1: Write failing tests**

```ts
const ctx = { config: DEFAULT_CONFIG, readFile: () => null };
test('new npm deps and lifecycle scripts reported; version bumps not', () => {
  const files: Record<string, string> = {
    'base:package.json': JSON.stringify({ dependencies: { a: '^1.0.0' } }),
    'head:package.json': JSON.stringify({
      dependencies: { a: '^2.0.0', 'left-pad': '1.3.0' },
      scripts: { postinstall: 'node x.js' },
    }),
  };
  const c = {
    config: DEFAULT_CONFIG,
    readFile: (ref: 'base' | 'head', p: string) => files[`${ref}:${p}`] ?? null,
  };
  assert.deepEqual(
    dependencyAdded.check([fd('package.json')], c).map((f) => f.message),
    [
      'New dependency: left-pad@1.3.0 (dependencies)',
      'Install lifecycle script changed: postinstall',
    ],
  );
});
test('invalid head package.json does not throw', () => {
  const c = {
    config: DEFAULT_CONFIG,
    readFile: (ref: 'base' | 'head') => (ref === 'head' ? '{ nope' : null),
  };
  assert.deepEqual(
    dependencyAdded.check([fd('pkg/package.json', { status: 'added' })], c).map((f) => f.message),
    ['package.json is not valid JSON'],
  );
});
test('requirements.txt: new names flagged, pin changes and -r lines not', () => {
  const out = dependencyAdded.check(
    [
      fd('requirements.txt', {
        removed: ['requests==2.31.0'],
        added: [
          [1, 'requests==2.32.0'],
          [2, 'evil-pkg>=0.1  # helper'],
          [3, '-r base.txt'],
        ],
      }),
    ],
    ctx,
  );
  assert.deepEqual(
    out.map((f) => f.line),
    [2],
  );
});
test('suppressions flagged by line; binary skipped', () => {
  const out = suppressionAdded.check(
    [
      fd('src/a.ts', {
        added: [
          [4, '// @ts-ignore'],
          [5, 'const ok = 1;'],
          [8, 'q = sql(x)  # nosemgrep'],
        ],
      }),
      fd('img.png', { binary: true }),
    ],
    ctx,
  );
  assert.deepEqual(
    out.map((f) => f.line),
    [4, 8],
  );
});
```

- [ ] **Step 2: Run, expect FAIL.** · **Step 3: Implement.** · **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit** — `but commit -m "Add dependency-added and suppression-added rules"`

---

### Task 7: Engine and reports

**Files:**

- Create: `src/rules/index.ts`, `src/engine.ts`, `src/report.ts`
- Test: `tests/engine.test.ts`, `tests/report.test.ts`

**Interfaces:**

- Consumes: all five rules (Tasks 4-6)
- Produces:
  ```ts
  // rules/index.ts
  export const ALL_RULES: Rule[]; // order: test-weakened, guardrail-edited, workflow-escalation, dependency-added, suppression-added
  // engine.ts
  export type Verdict = 'pass' | 'warn' | 'block';
  export function runGate(files: FileDiff[], ctx: RuleContext): Finding[]; // skips 'off' rules, attaches severity
  export function verdictOf(findings: Finding[]): Verdict;
  export function downgrade(findings: Finding[]): Finding[]; // every block → warn (override)
  // report.ts
  export function toMarkdown(findings: Finding[], verdict: Verdict, note?: string): string;
  export function toJson(findings: Finding[], verdict: Verdict): string; // { verdict, findings }
  export function toAnnotations(findings: Finding[]): string[];
  ```

Markdown: `## agentgate: <PASS|WARN|BLOCK>`, optional `note` paragraph, then `| Severity | Rule | Location | Finding |` with `file:line`; escape `|` as `\|` and newlines as spaces in cells. Empty → `No findings.`
Annotations: `::error file=<f>,line=<n>,title=agentgate/<rule>::<msg>` (`::warning` for warn; omit `line=` when absent). Data escapes `%`→`%25`, `\r`→`%0D`, `\n`→`%0A`; properties also `:`→`%3A`, `,`→`%2C`.

- [ ] **Step 1: Write failing tests**

```ts
test('off rules skipped, severities attached, verdict is worst', () => {
  const config = {
    ...DEFAULT_CONFIG,
    rules: { ...DEFAULT_CONFIG.rules, 'suppression-added': 'off' as const },
  };
  const f = runGate([fd('src/a.ts', { added: ['// @ts-ignore'] }), fd('.github/CODEOWNERS')], {
    config,
    readFile: () => null,
  });
  assert.deepEqual(
    f.map((x) => [x.rule, x.severity]),
    [['guardrail-edited', 'block']],
  );
  assert.equal(verdictOf(f), 'block');
  assert.equal(verdictOf([]), 'pass');
  assert.equal(verdictOf(downgrade(f)), 'warn');
});
test('annotations escape newlines and property separators', () => {
  const [a] = toAnnotations([
    { rule: 'suppression-added', severity: 'warn', file: 'a,b:c.ts', line: 2, message: 'x\ny%' },
  ]);
  assert.equal(a, '::warning file=a%2Cb%3Ac.ts,line=2,title=agentgate/suppression-added::x%0Ay%25');
});
test('markdown escapes pipes and shows note', () => {
  const md = toMarkdown(
    [{ rule: 'test-weakened', severity: 'block', file: 't.ts', line: 1, message: 'a | b' }],
    'block',
    'Override label ignored: x',
  );
  assert.match(md, /a \\\| b/);
  assert.match(md, /Override label ignored: x/);
});
```

- [ ] **Step 2: Run, expect FAIL.** · **Step 3: Implement.** · **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit** — `but commit -m "Add gate engine and Markdown, JSON, annotation reports"`

---

### Task 8: CLI

**Files:**

- Create: `src/collect.ts`, `src/cli.ts`
- Test: `tests/cli.test.ts`

**Interfaces:**

- Consumes: `createGit`, `loadConfig`, `runGate`, `verdictOf`, `toMarkdown`, `toJson`
- Produces:
  ```ts
  // collect.ts: resolves both refs, loads config at base, builds readFile via git.show
  export function collect(
    cwd: string,
    base: string,
    head: string,
    configPath?: string,
  ): { files: FileDiff[]; ctx: RuleContext; baseSha: string; headSha: string };
  // cli.ts
  export function main(
    argv: string[],
    io: { cwd: string; out(s: string): void; err(s: string): void },
  ): number;
  ```

Usage: `agentgate check --base <ref> [--head <ref>=HEAD] [--config <path at base>=.agentgate.json] [--format md|json]=md`. Parse with `node:util` `parseArgs` (`strict: true`, `allowPositionals: true`). `--help` (with or without `check`) → usage, 0. First positional not `check`, missing `--base`, unknown flag, bad `--format`, or `GateError` → message on `err`, 2. Other errors rethrow. Verdict `block` → 1, else 0. File starts `#!/usr/bin/env node`; entry guard `if (import.meta.main) process.exitCode = main(process.argv.slice(2), { cwd: process.cwd(), out: console.log, err: console.error })`.

- [ ] **Step 1: Write failing tests** (temp repos via `makeRepo`; `io` captures into strings)

```ts
test('clean PR → 0, PASS', () => {
  /* head adds src/a.ts */ assert.equal(code, 0);
  assert.match(out, /agentgate: PASS/);
});
test('skip added in test → 1 with file:line', () => {
  /* head adds it.skip at line 2 of tests/a.test.ts */ assert.equal(code, 1);
  assert.match(out, /tests\/a\.test\.ts:2/);
});
test('agent disables rule in head .agentgate.json → still 1, both findings', () => {
  // base: no config. head: .agentgate.json {"rules":{"test-weakened":"off"}} + it.skip in tests/a.test.ts
  assert.equal(code, 1);
  assert.match(out, /test-weakened/);
  assert.match(out, /\.agentgate\.json/);
});
test('--format json parses', () => {
  assert.equal(JSON.parse(out).verdict, 'block');
});
test('missing --base or unknown base SHA → 2 on stderr', () => {
  assert.equal(main(['check'], io), 2);
  assert.equal(main(['check', '--base', 'f'.repeat(40)], io), 2);
  assert.match(err, /fetch-depth: 0/);
});
```

- [ ] **Step 2: Run, expect FAIL.** · **Step 3: Implement.** · **Step 4: Run, expect PASS.**
- [ ] **Step 5: Smoke** — inside `~/Projects/agentgate`: `node src/cli.ts check --base HEAD~3` prints a report; exit 0 or 1.
- [ ] **Step 6: Commit** — `but commit -m "Add agentgate check CLI"`

---

### Task 9: GitHub Action entry and override

**Files:**

- Create: `src/action.ts`, `action.yml`, `dist/` (built)
- Test: `tests/action.test.ts`

**Interfaces:**

- Consumes: `collect`, `runGate`, `verdictOf`, `downgrade`, `toMarkdown`, `toAnnotations`
- Produces:
  ```ts
  export interface LabelEvent {
    event: string;
    label?: { name: string };
    actor: { login: string; type: string };
  }
  export function overrideBy(
    events: LabelEvent[],
    label: string,
    prAuthor: string,
  ): { accepted: boolean; reason: string };
  export function run(env: NodeJS.ProcessEnv, fetchFn: typeof fetch): Promise<number>;
  ```

`action.yml`: `name: agentgate`, `description: Block AI-agent PRs that weaken tests, edit guardrails, or escalate CI permissions`, inputs `config-path` (default `.agentgate.json`) and `github-token` (default `${{ github.token }}`), output `verdict`, `runs: { using: node24, main: dist/action.js }`, `branding: { icon: shield, color: red }`.

`run` flow:

1. Read `GITHUB_EVENT_PATH`. No `pull_request` key → print `::error::agentgate runs on pull_request events`, return 2.
2. `collect(GITHUB_WORKSPACE, pr.base.sha, pr.head.sha, env['INPUT_CONFIG-PATH'])` → `runGate`.
3. Verdict `block`, PR labels include `config.overrideLabel`, and `event.action === 'synchronize'` → keep block, note `Override label ignored: new commits pushed after approval; remove and re-apply the label`, and skip the API call. Otherwise, when the verdict is `block` and the label is present → GET `${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/issues/${pr.number}/events?per_page=100` with `Authorization: Bearer ${INPUT_GITHUB-TOKEN}`, follow `Link: rel="next"`, then `overrideBy(events, label, pr.user.login)`. Accepted → `downgrade`, note `Override by @<login> via label <label>`. Rejected → note `Override label ignored: <reason>`. HTTP failure → keep block, note `Override check failed: HTTP <status>`.
4. Append `toMarkdown` to `GITHUB_STEP_SUMMARY`; print `toAnnotations`; append `verdict=<v>\n` to `GITHUB_OUTPUT`.
5. `GateError` → `::error::<msg>`, 2. Otherwise `block` → 1, else 0.

`overrideBy`: the latest `labeled`/`unlabeled` event for the label decides. Reasons: accepted `"applied by @<login>"`; rejected `"label not found in events"`, `"label was removed"`, `"applied by a bot (<login>)"` (`actor.type !== 'User'`), `"applied by the PR author (<login>)"`.

- [ ] **Step 1: Write failing tests**

```ts
const L = 'agentgate-approved';
const ev = (login: string, type: string, event = 'labeled') => ({
  event,
  label: { name: L },
  actor: { login, type },
});
test('override accepted from a human reviewer', () => {
  assert.deepEqual(overrideBy([ev('piyush97', 'User')], L, 'copilot-swe-agent[bot]'), {
    accepted: true,
    reason: 'applied by @piyush97',
  });
});
test('override rejected for bot, PR author, or later unlabel', () => {
  assert.equal(overrideBy([ev('github-actions[bot]', 'Bot')], L, 'dev').accepted, false);
  assert.equal(overrideBy([ev('dev', 'User')], L, 'dev').accepted, false);
  assert.equal(
    overrideBy([ev('lead', 'User'), ev('lead', 'User', 'unlabeled')], L, 'dev').reason,
    'label was removed',
  );
});
test('run(): non-PR event → 2', async () => {
  /* event JSON {"push":{}} */ assert.equal(code, 2);
});
test('run(): blocking PR writes summary, annotations, verdict output', async () => {
  // temp repo with it.skip; temp files for GITHUB_EVENT_PATH, GITHUB_STEP_SUMMARY, GITHUB_OUTPUT; fetchFn throws if called
  assert.equal(code, 1);
  assert.match(readFileSync(summary, 'utf8'), /agentgate: BLOCK/);
  assert.match(readFileSync(output, 'utf8'), /verdict=block/);
});
test('run(): self-applied label keeps block and says why', async () => {
  // PR labels include agentgate-approved; fetchFn returns [ev(prAuthor, 'User')]
  assert.equal(code, 1);
  assert.match(summaryText, /Override label ignored: applied by the PR author/);
});
test('run(): label present on synchronize → block, no API call', async () => {
  // event.action 'synchronize', labels include agentgate-approved; fetchFn throws if called
  assert.equal(code, 1);
  assert.match(summaryText, /new commits pushed after approval/);
});
```

- [ ] **Step 2: Run, expect FAIL.** · **Step 3: Implement** (entry guard: `if (import.meta.main) run(process.env, fetch).then((c) => { process.exitCode = c; })`).
- [ ] **Step 4: Run, expect PASS** — `npm test`.
- [ ] **Step 5: Build** — `npm run build` → `dist/action.js` and `dist/cli.js` exist; `node dist/cli.js --help` exits 0.
- [ ] **Step 6: Commit** — `but commit -m "Add GitHub Action with human-only override label"` (includes `dist/`).

---

### Task 10: Dogfood, example workflow, docs

**Files:**

- Create: `.github/workflows/ci.yml`, `.github/workflows/agentgate.yml`, `.github/CODEOWNERS` (`* @piyush97`), `.agentgate.json` (`{}`), `examples/agent-pr-gate.yml`, `README.md`, `LICENSE` (MIT)

- [ ] **Step 1: CI** — `ci.yml` on `push` and `pull_request`: Node 24, `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --exit-code dist/` (fails on stale `dist/`). Actions pinned to full SHAs.
- [ ] **Step 2: Self-gate** — `agentgate.yml` on `pull_request: { types: [opened, synchronize, reopened, labeled, unlabeled] }`, `permissions: { contents: read, pull-requests: read }`, checkout with `fetch-depth: 0`, `uses: ./`. Caveat: `./` runs the PR's own `dist/`, so a PR can change the gate it is tested by. That's acceptable before release; CODEOWNERS `* @piyush97` covers it. After v0.1, switch to the released full SHA.
- [ ] **Step 3: Example** — `examples/agent-pr-gate.yml`: the post's `sast` and `secrets` jobs unchanged; `test-integrity` job replaced by checkout (`fetch-depth: 0`) + `uses: piyush97/agentgate@<FULL_SHA> # v0.1.0`. Pin every action to a full SHA: a mutable `@v0` would fail agentgate's own `workflow-escalation` pin check. Leave a clearly labeled `<FULL_SHA>` placeholder until the release exists.
- [ ] **Step 4: README** — what it blocks (five rules, one line each, default severity); 10-line quick start; `.agentgate.json` reference with defaults and the append-only `protectedPaths` rule; override label rules (human-only, not the author, re-apply after new pushes); "Required setup" (mark `agentgate` as a required status check, add `.github/** @owner` to CODEOWNERS, enable "Require review from Code Owners"; for orgs, run it as a ruleset-required workflow so a PR can't edit it away); "What it does not catch" (authz, IDOR, tenant isolation, business logic, per the post); link to the post.
- [ ] **Step 5: Verify** — `npm test && npm run build && git diff --exit-code dist/` pass; `node dist/cli.js check --base <first commit SHA>` exits **1** (expected) and reports `guardrail-edited` for `.github/**` and `.agentgate.json`.
- [ ] **Step 6: Commit** — `but commit -m "Dogfood agentgate in CI and document usage"`
- [ ] **Step 7: Stop and ask Piyush** before: creating the GitHub repo, pushing, tagging `v0.1.0` + `v0`, `npm publish --access public --provenance`, Marketplace listing.

---

## After v0.1 (not in this plan)

- Demo repo with three agent-style PRs (skip added, CODEOWNERS edit, `pull_request_target`) each blocked.
- Follow-up post linking the Action; add to `/projects` on piyushmehta.com.
- More rules once there's real false-positive data: `go.mod`/`Cargo.toml` deps, lockfile-only changes, monitoring-config deletions.
