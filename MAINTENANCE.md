# MAINTENANCE.md — consolidated maintenance handbook

This is the single maintenance handbook for the **7 active profile repositories**
under [github.com/piyush97](https://github.com/piyush97). It summarizes the
cross-repo automation (CI, Dependabot, stale-bot), the incident runbook, and the
routine processes a maintainer follows. Each repository also ships its own
detailed runbook — `MAINTAINING.md` at the repo root — which is the source of
truth for per-repo commands.

> Excluded: [Slika-API](https://github.com/piyush97/Slika-API) is archived and
> not maintained here. Other piyush97 repositories are outside this
> maintenance scope.

## 1. Repositories covered

| Repo | Language | Default branch | CI status | Dependency automation | Stale-bot |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [PiyushMehta.com](https://github.com/piyush97/PiyushMehta.com) | Astro 7 / TypeScript 6 (React 19 islands) | `main` | ✅ green | Dependabot (npm/bun.lock + GitHub Actions) **+** weekly `dependency-updates.yml` bulk PR | ✅ weekly, label-only |
| [mcp-server-typescript-starter](https://github.com/piyush97/mcp-server-typescript-starter) | TypeScript (Node 22, npm) | `main` | ✅ green | Dependabot (npm + GitHub Actions) | ✅ weekly, label-only |
| [awesome-portfolio](https://github.com/piyush97/awesome-portfolio) | TypeScript (Vite 5 + React 18, Yarn v1) | `main` | ✅ green | Dependabot (npm/yarn.lock + GitHub Actions) | ✅ weekly, label-only |
| [homelab-gitops](https://github.com/piyush97/homelab-gitops) | HCL (Terraform) + Ansible | `main` | ✅ green | Dependabot (terraform + GitHub Actions) | ✅ weekly, label-only |
| [health-visualizer](https://github.com/piyush97/health-visualizer) | TypeScript (Next.js, npm canonical) | `main` | ✅ green | Dependabot (npm + GitHub Actions) | ✅ weekly, label-only |
| [proxmox-dr-mcp](https://github.com/piyush97/proxmox-dr-mcp) | Python 3.11–3.13 (uv) | `main` | ✅ green | Dependabot (pip + uv + GitHub Actions + docker) | ✅ weekly, label-only |
| [watchbot](https://github.com/piyush97/watchbot) | Python 3.11–3.12 (Hermes plugin) | `main` | ✅ green | Dependabot (pip + GitHub Actions) | ✅ weekly, label-only |

CI status is the latest `main`-branch run of each repo's primary workflow
(verified 2026-08-20). Dependency automation = `.github/dependabot.yml`
(+ the pre-existing weekly `dependency-updates.yml` bulk-update workflow in
PiyushMehta.com — both are kept intentionally, see §2.1). Stale-bot =
`.github/workflows/stale.yml` in every repo.

## 2. Per-repo maintenance

### 2.1 PiyushMehta.com

- **Purpose:** personal website, blog, newsletter platform, and consulting
  landing page (Astro SSR, Vercel ISR).
- **CI commands** (from `.github/workflows/ci-cd.yml`): `bun install
  --frozen-lockfile` → `bun run check` (Code Quality) → `bun run build`
  (Build Verification) → `dist/` existence check → `src/middleware/security.ts`
  CSP/X-Frame-Options checks (Security Configuration Check). CodeQL and
  Dependency Review run alongside.
- **Dependabot config** (`.github/dependabot.yml`): `npm` ecosystem handles
  `bun.lock` (weekly Mon 06:00 UTC, grouped minor+patch PR, labeled
  `dependencies`, max 5 open) + `github-actions`. **Keep both** the Dependabot
  and the pre-existing `dependency-updates.yml` workflow (weekly `bun update`
  bulk PR) — Dependabot is primary, the workflow is the bulk fallback; do not
  delete either.
- **Stale policy** (`.github/workflows/stale.yml`): issues 60d / PRs 30d →
  labeled `stale` only, **never auto-closed**; Dependabot PRs exempt
  (`exempt-pr-labels: dependencies`).
- **Full runbook:** [MAINTAINING.md](https://github.com/piyush97/PiyushMehta.com/blob/main/MAINTAINING.md)

### 2.2 mcp-server-typescript-starter

- **Purpose:** production-grade MCP server starter kit (TypeScript, Node 22).
- **CI commands** (from `.github/workflows/ci.yml`): `npm ci` → `npm run
  typecheck` → `npm test`.
- **Dependabot config**: `npm` (weekly Mon 06:00 UTC, minor+patch grouped;
  **semver-major ignored** — handle majors deliberately) + `github-actions`.
- **Stale policy**: issues 60d / PRs 30d → `stale` label only, never
  auto-closed; Dependabot exempt.
- **Full runbook:** [MAINTAINING.md](https://github.com/piyush97/mcp-server-typescript-starter/blob/main/MAINTAINING.md)

### 2.3 awesome-portfolio

- **Purpose:** portfolio showcase website (Vite + React 18, Yarn classic v1).
- **CI commands** (from `.github/workflows/ci.yml`): `yarn install
  --frozen-lockfile` → `yarn build` (build only — `yarn lint` fails because
  ESLint is not installed/configured; restoring linting is tracked in the
  runbook).
- **Dependabot config**: `npm` for `yarn.lock` (weekly Mon 06:00 UTC,
  minor+patch grouped) + `github-actions`.
- **Stale policy**: issues 60d / PRs 30d → `stale` label only, never
  auto-closed; Dependabot exempt.
- **Full runbook:** [MAINTAINING.md](https://github.com/piyush97/awesome-portfolio/blob/main/MAINTAINING.md)

### 2.4 homelab-gitops

- **Purpose:** Infrastructure-as-Code for a 28-container Proxmox homelab
  (Terraform + Ansible).
- **CI commands** (from `.github/workflows/ci.yml` + `terraform-validate.yml`):
  `terraform fmt -check -recursive` → `terraform init -backend=false
  -input=false` → `terraform validate` (Terraform Validation) and
  `ansible-inventory` + `ansible-playbook --syntax-check` (Ansible Validation).
- **Dependabot config**: `terraform` (directory `/terraform`, weekly Mon) +
  `github-actions`. No `.terraform.lock.hcl` is committed — Dependabot still
  proposes provider/module bumps.
- **Drift detection**: `.github/workflows/drift-detection.yml` runs daily
  06:00 UTC — see §4.5.
- **Stale policy**: issues 60d / PRs 30d → `stale` label only, never
  auto-closed; Dependabot exempt.
- **Full runbook:** [MAINTAINING.md](https://github.com/piyush97/homelab-gitops/blob/main/MAINTAINING.md)

### 2.5 health-visualizer

- **Purpose:** privacy-focused health data visualizer (Next.js; **npm is the
  canonical package manager** — `bun.lock` is present but not authoritative).
- **CI commands** (from `.github/workflows/ci.yml`): `npm ci --legacy-peer-deps`
  → `npm run build` → `npm run lint` (non-blocking debt tracker,
  `continue-on-error`) → `npm run typecheck`. Requires the placeholder env in
  the workflow (`DATABASE_URL`, Clerk test key, `SKIP_ENV_VALIDATION=1`).
- **Dependabot config**: `npm` (weekly Mon 06:00 UTC, minor+patch grouped) +
  `github-actions`.
- **Stale policy**: issues 60d / PRs 30d → `stale` label only, never
  auto-closed; Dependabot exempt.
- **Full runbook:** [MAINTAINING.md](https://github.com/piyush97/health-visualizer/blob/main/MAINTAINING.md)

### 2.6 proxmox-dr-mcp

- **Purpose:** MCP server for Proxmox DR (disaster recovery) operations
  (Python 3.11–3.13, uv).
- **CI commands** (from `.github/workflows/ci.yml`): matrix Py 3.11/3.12/3.13 →
  `uv sync --frozen --no-dev` → `uv run python tests/test_smoke.py` →
  `uv run python tests/test_safety.py` (`test_live.py` needs a real Proxmox
  host + credentials, not in CI).
- **Dependabot config**: `pip` + `uv` (keeps `uv.lock` in sync) +
  `github-actions` + `docker` (Python base image) — all weekly Mon 06:00 UTC.
- **Stale policy**: issues 60d / PRs 30d → `stale` label only, never
  auto-closed; Dependabot exempt.
- **Full runbook:** [MAINTAINING.md](https://github.com/piyush97/proxmox-dr-mcp/blob/main/MAINTAINING.md)

### 2.7 watchbot

- **Purpose:** Hermes Agent plugin for unified homelab + social media
  monitoring (Python 3.11–3.12).
- **CI commands** (from `.github/workflows/ci.yml`): Lint — `ruff check .`
  (Py 3.12, rules pinned to `E4,E7,E9,F`); Test — `pytest -v` (Py 3.11 + 3.12;
  `pythonpath=["src"]` + `--import-mode=importlib`).
- **Dependabot config**: `pip` (weekly Mon 06:00 UTC, minor+patch grouped) +
  `github-actions`.
- **Stale policy**: issues 60d / PRs 30d → `stale` label only, never
  auto-closed; Dependabot exempt.
- **Full runbook:** [MAINTAINING.md](https://github.com/piyush97/watchbot/blob/main/MAINTAINING.md)

## 3. Cross-repo processes

### 3.1 Dependency updates — weekly review cadence

Dependabot opens PRs **every Monday 06:00 UTC** in all 7 repos (plus
PiyushMehta.com's bulk `dependency-updates.yml` PR Monday 09:00 UTC). Weekly
triage, same day is best:

1. **List the week's Dependabot PRs** across repos:

   ```bash
   gh pr list --repo piyush97/PiyushMehta.com --label dependencies
   gh pr list --repo piyush97/mcp-server-typescript-starter --label dependencies
   gh pr list --repo piyush97/awesome-portfolio --label dependencies
   gh pr list --repo piyush97/homelab-gitops --label dependencies
   gh pr list --repo piyush97/health-visualizer --label dependencies
   gh pr list --repo piyush97/proxmox-dr-mcp --label dependencies
   gh pr list --repo piyush97/watchbot --label dependencies
   ```

2. **Review** — read the PR body (linked release notes), scan the diff, check
   for breaking major bumps. Grouped minor+patch PRs are low risk; major
   upgrades (and anything touching `react`, `next`, `vite`, `astro`, `terraform`
   providers) get a deliberate look.
3. **Merge policy** — merge only when the PR's CI is **green**:

   ```bash
   gh pr merge <n> --repo piyush97/<repo> --squash --delete-branch
   ```

4. **Verify after merge** — confirm the default-branch CI run succeeds (see
   §4.1 for the exact command).
5. For **conflicting** Dependabot PRs in PiyushMehta.com (same week as the bulk
   workflow PR): merge the granular Dependabot PRs first, then let the bulk PR
   handle what remains. Never delete the bulk workflow.

### 3.2 Stale issue/PR handling

`stale.yml` runs **every Monday 09:00 UTC** in every repo. Policy is uniform:

- **Issues**: labeled `stale` after **60 days** inactive — **never auto-closed**
  (`days-before-issue-close: -1`).
- **PRs**: labeled `stale` after **30 days** inactive — **never auto-closed**.
- Dependabot PRs are exempt (`exempt-pr-labels: dependencies`).

A `stale` label is a triage nudge: respond, update, or close the item
yourself. Any comment/activity clears the label (`remove-stale-when-updated:
true`). Nothing is ever deleted or closed automatically.

### 3.3 CI red → troubleshoot + rerun

1. Open **Actions** on the repository page and find the failing run.
2. **Rerun flaky failures first** (infra/network flakes) via
   `gh run rerun <run-id> --repo piyush97/<repo>`.
3. If it fails again, fix forward — see the incident runbook (§6.1) for the
   common failure modes per repo.
4. Never merge a PR with red CI. Dependabot PRs that break CI are fixed in
   `main` (dependency update, config change, or upstream pin) and then
   rebased/recreated.

### 3.4 Homelab drift-detection cadence

`.github/workflows/drift-detection.yml` in homelab-gitops runs **daily at
06:00 UTC** (and manually via **Actions → Infrastructure Drift Detection →
Run workflow**):

- `exit 0` → no drift; `exit 2` → drift report artifact (`drift-report.md`,
  30-day retention) + webhook; `exit 1` → plan error (missing
  `PROXMOX_API_*` secrets/state) — non-fatal, workflow stays green.
- **Troubleshooting pointer:** the full symptom → cause table lives in
  homelab-gitops' [MAINTAINING.md](https://github.com/piyush97/homelab-gitops/blob/main/MAINTAINING.md)
  (§ Drift detection). Summary: self-hosted-runner cancellation (fixed 2026-08,
  now `ubuntu-latest`), trivy/upload-sarif pinning (fixed), missing secrets or
  state → plan step reports `skipped`.

### 3.5 Release / verify checklist

For any repo, before and after a change:

```bash
# Local gate (repo-specific — see that repo's MAINTAINING.md for exact commands)
bun run check 2>/dev/null || npm run typecheck || yarn build  # adapt per repo

# Open a PR, wait for CI green
gh pr create --repo piyush97/<repo> --title "..." --body "..."
# Merge (squash) only on green CI
gh pr merge <n> --repo piyush97/<repo> --squash --delete-branch

# Verify default-branch CI after merge
gh api "repos/piyush97/<repo>/actions/runs?branch=main&per_page=1" \
  --jq '.workflow_runs[0] | "\(.name) → \(.conclusion)"'
```

Per-repo release specifics (version bump locations, tags, PyPI, Vercel) are in
each `MAINTAINING.md`.

## 4. Security

- **SECURITY.md:** none of the 7 repos ships one yet. Reports come via GitHub
  issues/PRs or [GitHub private vulnerability reporting](https://github.com/piyush97)
  where available; any security issue takes priority over routine maintenance.
- **Dependabot alerts:** ⚠️ **currently disabled repo-wide** (verified
  2026-08-20: `gh api repos/piyush97/<repo>/vulnerability-alerts` → 404 on all
  7). Re-enable per repo via **Settings → Code security and analysis →
  Dependabot alerts**, or `gh api -X PUT
  repos/piyush97/<repo>/vulnerability-alerts`. Once enabled, triage alerts
  during the weekly dependency pass (§3.1).
- **CodeQL + Dependency Review:** enabled on PiyushMehta.com
  (`codeql-analysis.yml` + `dependency-review-config.yml`) and run as part of
  its `ci-cd.yml` gate.
- **Security PR fast-track:** a PR that fixes a vulnerability (CVE), a CodeQL
  finding, or a dependency-review failure is reviewed and merged first, ahead
  of the weekly batch. Same gate applies — CI green — but it skips the weekly
  queue and gets immediate attention.
- **Secret scanning:** PiyushMehta.com uses varlock pre-commit secret scanning;
  GitHub secret scanning is part of the standard GitHub security features for
  public repos.

## 5. Incident runbook

### 5.1 CI red (any repo)

1. `gh run list --repo piyush97/<repo> --branch main --limit 5` — identify the
   failing workflow.
2. Open the run logs; check whether the failure is infra/flaky (rerun) or a
   real regression (fix).
3. Common repo-specific causes:

   | Repo | Likely cause of red CI |
   | :--- | :--- |
   | PiyushMehta.com | `bun run check` format/lint/type errors; build pipeline failure (typegen, pagefind, sitemap, RSS); security-config grep failure |
   | mcp-server-typescript-starter | typecheck failure; vitest failure; broken `package-lock.json` after a bad Dependabot merge |
   | awesome-portfolio | `yarn build` (tsc/vite) failure; `yarn.lock` drift (never `yarn install` without `--frozen-lockfile`) |
   | homelab-gitops | `terraform validate` failure; `ansible-playbook --syntax-check` failure; provider version incompatibility |
   | health-visualizer | ERESOLVE without `--legacy-peer-deps`; build failure from missing env (use the workflow's placeholder env); typecheck |
   | proxmox-dr-mcp | `uv sync --frozen` failure (uv.lock out of sync with pyproject); smoke/safety test failure |
   | watchbot | ruff failure (do not broaden `select`); pytest collection failure (`--import-mode=importlib` must stay) |

4. Fix forward on a branch, PR, wait for green, squash-merge.

### 5.2 Dependabot PR conflicts

Symptom: a Dependabot PR shows `This branch has conflicts` or CI fails on a
stale base.

1. If the conflict is in a lockfile/manifest, the cleanest fix is to **close
   the PR** (Dependabot will recreate it on its next run) or use the "Update
   branch" button after merging the conflicting PR.
2. If `main` moved: click **Update branch** on the PR.
3. If the PR is stale because a dependency was already bumped: close it —
   Dependabot reopens/updates automatically.

### 5.3 Drift-detection alerts (homelab-gitops)

1. Check the failing job: **Actions → Infrastructure Drift Detection**.
2. `exit 2` (drift) → download the `drift-report.md` artifact, apply the
   change via `deploy.yml` (workflow_dispatch) after reviewing the plan.
3. `exit 1` (plan error) → missing `PROXMOX_API_*` secrets or no state;
   verify secrets and state, rerun.
4. Workflow never starts / "cancelled" → self-hosted runner issue; the
   workflow now uses `ubuntu-latest` (fixed 2026-08) — if it reappears, check
   the runner registration and the workflow's `runs-on`.

### 5.4 Bulk workflow PR conflicts (PiyushMehta.com)

The `dependency-updates.yml` PR may conflict with granular Dependabot PRs.

1. Merge the granular Dependabot PRs first (CI green).
2. If the bulk PR still conflicts, update it via **Update branch** and let CI
   rerun; merge only when green.
3. Never delete the workflow (dual-track is intentional — §2.1).

## 6. Quick reference

| Task | Where |
| :--- | :--- |
| Per-repo commands, env vars, release steps | `MAINTAINING.md` in each repo (§2 links) |
| Weekly dependency triage | §3.1 (list + merge policy) |
| Stale label policy | §3.2 (60d issues / 30d PRs, never auto-close) |
| Drift detection cadence | §3.4 (daily 06:00 UTC, homelab-gitops) |
| Security triage + fast-track | §4 |
| Incident resolution | §5 |
