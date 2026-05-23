# PRD: sh1pt Actions Store + Actions Fleet

**Product:** sh1pt Cloud paid module
**Working names:** sh1pt Actions Store, sh1pt Actions Fleet
**Owner:** Profullstack / sh1pt
**Date:** 2026-05-22
**Status:** Draft for Claude Code implementation planning
**Primary repo:** `profullstack/sh1pt`

---

## 1. Executive summary

Add a paid sh1pt Cloud module that lets users discover, install, update, harden, and manage GitHub Actions workflow packs across one repo or an entire GitHub organization.

The core product is **not** "install GitHub Actions YAML easily." The stronger product is:

> **Make every repo shippable.** sh1pt scans a GitHub org, recommends workflow packs, opens pull requests to install them, detects drift, and keeps CI/security/release/deploy/agent workflows up to date.

The **Actions Store** is the catalog layer. It contains first-party and later third-party workflow packs. Packs are installable bundles, not merely single GitHub Actions. A pack may include workflows, Dependabot config, release config, labels, docs, and sh1pt metadata.

The **Actions Fleet** service is the fleet-management layer. It connects to GitHub as a GitHub App, inventories repos, detects stacks, audits existing workflows, recommends packs, opens PRs, tracks adoption, and alerts when workflows drift or become unsafe.

This fits sh1pt because sh1pt already centers on one manifest, one CLI, cloud-managed credentials, policy linting, VCS integration, build/publish/scale/iterate workflows, and AI-agent-assisted iteration.

---

## 2. Current sh1pt context

sh1pt public positioning:

- "Build. Promote. Scale. Iterate…"
- "One codebase → every store, registry, CDN, and channel."
- "sh1pt is the single command between an idea and global distribution."
- sh1pt Cloud is described as running build runners, credentials vault, store submission polling, policy linter, and rate-limit guardrails.
- The repo already exposes VCS commands, a secret vault, and `iterate agents` for Claude Code / Codex / Qwen.
- The repo already tries to preserve a tight top-level CLI surface around the four verbs: `build`, `promote`, `scale`, and `iterate`.

Product implication:

- Do **not** add a new top-level `repo` command unless the maintainer explicitly accepts breaking the four-verb design principle.
- Prefer nesting under `sh1pt build actions ...` for workflow installation and under `sh1pt iterate agents ...` for AI-agent workflow templates.
- Use "Actions Fleet" as the paid dashboard/module name, while the CLI remains consistent with the four-verb model.

---

## 3. Problem statement

Teams with many repos accumulate inconsistent, stale, and unsafe automation:

- Some repos have no CI.
- Some use old Node/Python/Rust workflows.
- Some deploy differently from every other repo.
- Some have release workflows, some do not.
- Some reference mutable third-party action tags instead of pinned SHAs.
- Some use broad `GITHUB_TOKEN` permissions.
- Some have dangerous `pull_request_target` patterns.
- Updates require copy/pasting YAML across many repos.
- Security fixes require manually auditing every `.github/workflows/*.yml` file.
- Agencies and AI-agent builders can generate apps faster than they can normalize repo automation.

GitHub already has GitHub Actions, Marketplace actions, reusable workflows, and organization settings. The gap is an opinionated, sh1pt-native layer for **packaged workflow installation, fleet visibility, drift detection, and repo hardening**.

---

## 4. Product vision

> sh1pt Actions Fleet keeps every repo in an org buildable, secure, releasable, deployable, and agent-ready.

The user should be able to connect a GitHub org, select a workflow pack from the Actions Store, choose repos, and get clean pull requests opened automatically.

Future state:

1. A founder generates 20 apps with agents.
2. sh1pt scans all 20 repos.
3. sh1pt installs CI, release, security, deploy, and agent iteration workflows.
4. sh1pt identifies missing secrets and deployment targets.
5. sh1pt opens PRs to fix risky workflows.
6. sh1pt keeps every workflow synced as packs improve.
7. sh1pt upsells into shipping, promotion, infra, monitoring, and agent iteration.

---

## 5. Goals

### 5.1 Business goals

- Create a paid service that can be sold immediately to teams with multiple repos.
- Add a practical entry point into sh1pt Cloud before users need full "ship everywhere" functionality.
- Increase retention by making sh1pt responsible for ongoing repo hygiene.
- Create a future marketplace revenue stream by letting creators publish paid workflow packs.
- Expand sh1pt's "single command to ship" vision upstream into repo readiness.

### 5.2 User goals

- Install proven GitHub Actions workflows without hand-writing YAML.
- Apply the same workflow pack to many repos at once.
- Know which repos are missing CI, release, deploy, or security automation.
- Detect outdated, drifted, or unsafe workflows.
- Open reviewable PRs rather than making hidden direct commits.
- Make repos ready for human and AI-agent development loops.

### 5.3 Technical goals

- Add an action-pack schema that is easy to validate and version.
- Add a renderer that creates deterministic workflow files from pack templates.
- Add a GitHub App integration that can inventory repos and open PRs.
- Add CLI commands that work locally before the full cloud/dashboard exists.
- Add a dashboard/API path for paid org-level scanning and bulk PRs.
- Avoid storing long-lived GitHub installation tokens.

---

## 6. Non-goals

For MVP, do not:

- Replace GitHub Actions or GitHub Marketplace.
- Run customer CI jobs outside GitHub.
- Automatically merge PRs.
- Directly push to default branches by default.
- Support GitLab/Gitea beyond schema design placeholders.
- Build a full creator marketplace with payouts on day one.
- Manage customer secrets automatically beyond naming/mapping required secrets.
- Promise that every third-party action is safe.
- Auto-fix every possible workflow vulnerability.

---

## 7. Target users and personas

### 7.1 Indie hacker / AI-agent builder

Has 5–50 generated repos. Wants every repo to have basic CI, deploy previews, release automation, and an agent-friendly iteration loop.

Primary value:

- "Make all these repos not suck."
- "Give Claude Code/Codex safe workflows to test and open PRs."

### 7.2 Agency / freelancer

Manages many client repos. Wants a standard baseline for CI, security scans, releases, and deploys.

Primary value:

- "Install our house automation stack across every client repo."
- "Show clients a dashboard of repo health."

### 7.3 Open-source maintainer

Maintains many public repos. Wants consistent CI, release, labels, Dependabot, CodeQL, and package publishing.

Primary value:

- "Bulk update workflow versions and PR them safely."
- "Find repos that lost their release workflow."

### 7.4 DevOps / platform engineer

Owns dozens or hundreds of internal repos. Wants policy visibility and remediation PRs.

Primary value:

- "Which repos are missing required workflows?"
- "Which workflows use risky permissions?"
- "Can I roll out the new secure CI template across 300 repos?"

### 7.5 Workflow pack creator

Creates reusable CI/deploy/security workflow packs. Wants discovery, distribution, analytics, and eventual revenue.

Primary value:

- "Publish a workflow pack once and let sh1pt users install it across repos."

---

## 8. Positioning

### 8.1 Product tagline options

- **Make every repo shippable.**
- **GitHub Actions fleet management for teams shipping with humans and agents.**
- **Install, update, and harden CI/CD across every repo.**
- **The Actions Store for shippable repos.**

### 8.2 Landing page copy

```md
## Actions Fleet

Your repos should not rot.

sh1pt scans your GitHub org, finds missing CI, outdated Actions,
unsafe workflow permissions, broken release pipelines, and inconsistent
deploy configs — then opens clean pull requests to fix everything.

- Install CI across every repo
- Add security scanning in minutes
- Keep GitHub Actions updated
- Detect workflow drift
- Harden permissions automatically
- Make every repo agent-ready
```

CTA options:

- `Connect GitHub`
- `Scan my repos`
- `Install workflow packs`
- `Make every repo shippable`

---

## 9. Product surface

### 9.1 Dashboard

New sh1pt Cloud dashboard area:

```txt
/sh1pt-cloud/actions-fleet
/sh1pt-cloud/actions-fleet/repos
/sh1pt-cloud/actions-fleet/packs
/sh1pt-cloud/actions-fleet/installs
/sh1pt-cloud/actions-fleet/findings
/sh1pt-cloud/actions-fleet/settings
```

Dashboard capabilities:

- Connect GitHub org/user through GitHub App installation.
- List accessible repos.
- Filter repos by language, framework, private/public, workflow status, risk score.
- Browse the Actions Store.
- See recommended packs per repo.
- Open install/update PRs.
- Track PR status.
- View audit findings.
- View billing limits and usage.

### 9.2 CLI

Preserve the four-verb model. Add nested commands under `build actions`.

Recommended MVP CLI:

```bash
sh1pt build actions search [query]
sh1pt build actions list
sh1pt build actions show <pack-id>
sh1pt build actions plan <pack-id> --repo .
sh1pt build actions install <pack-id> --repo . --dry-run
sh1pt build actions install <pack-id> --repo owner/name --pr
sh1pt build actions audit --repo .
sh1pt build actions audit --org <org> --json
sh1pt build actions sync --repo owner/name --pr
sh1pt build actions sync --org <org> --pack <pack-id> --pr
```

Future creator commands:

```bash
sh1pt build actions pack init
sh1pt build actions pack validate ./my-pack
sh1pt build actions pack publish ./my-pack --visibility public
sh1pt build actions pack stats <pack-id>
```

### 9.3 Manifest

Extend `sh1pt.config.ts` with an `actionsFleet` block.

```ts
// sh1pt.config.ts
export default {
  actionsFleet: {
    provider: 'github',
    installMode: 'pull-request',
    defaultBaseBranch: 'main',
    packs: [
      {
        id: 'node-pnpm-ci',
        version: '^1.0.0',
        repos: ['profullstack/sh1pt', 'profullstack/example-app'],
        inputs: {
          nodeVersion: '22',
          packageManager: 'pnpm',
          testCommand: 'pnpm test',
          typecheckCommand: 'pnpm typecheck'
        }
      },
      {
        id: 'actions-security-baseline',
        version: '^1.0.0',
        repos: ['*'],
        inputs: {
          pinThirdPartyActions: true,
          leastPrivilegePermissions: true,
          timeoutMinutes: 15
        }
      }
    ],
    policies: {
      requirePullRequest: true,
      preventDirectDefaultBranchWrites: true,
      detectDrift: true,
      scheduledAudit: 'weekly'
    }
  }
}
```

---

## 10. Actions Store model

### 10.1 Definition

An **Action Pack** is a versioned installable bundle of repo automation assets.

It can include:

- GitHub Actions workflow files.
- Dependabot configuration.
- Release configuration.
- Labeler configuration.
- CodeQL/Semgrep/Socket/security configs.
- README snippets.
- Required secret names.
- Required repository variables.
- Pack metadata and compatibility rules.
- Test fixtures for rendered outputs.

It is **not** necessarily a single GitHub Action. It may use many GitHub Actions and other repo configs.

### 10.2 Pack categories

- CI
- Test
- Security
- Release
- Deploy
- Package publish
- Agent workflows
- Repo hygiene
- Observability
- Monorepo
- Language-specific
- Framework-specific

### 10.3 Initial first-party packs

MVP should include these first-party packs:

| Pack ID | Purpose | Target repos |
|---|---|---|
| `node-pnpm-ci` | Node/TypeScript CI with pnpm install, typecheck, test | Node, TS, React, Next, SvelteKit |
| `bun-ci` | Bun-based install/test workflow | Bun projects |
| `python-fastapi-ci` | Python setup, lint, test workflow | Python/FastAPI projects |
| `rust-ci` | Rust fmt, clippy, test workflow | Rust projects |
| `docker-ghcr-build` | Build/push Docker image to GHCR | Dockerized apps |
| `release-please` | Release PRs and changelogs | Libraries/apps |
| `npm-publish` | Publish package to npm on release | JS packages |
| `github-pages-deploy` | Deploy static site to GitHub Pages | Docs/static sites |
| `vercel-deploy-preview` | Preview deploys for frontend apps | Vercel projects |
| `railway-deploy` | Deploy to Railway | Railway projects |
| `codeql-baseline` | CodeQL workflow | GitHub-supported languages |
| `dependabot-baseline` | Dependabot config | Most repos |
| `semgrep-scan` | Semgrep CI scan | App repos |
| `socket-scan` | Socket.dev dependency scan | JS/package repos |
| `actions-hardening` | Permissions, timeouts, SHA pinning recommendations | Existing Actions users |
| `agent-pr-loop` | Workflow for agent-generated branch test/report loops | AI-agent-driven projects |

### 10.4 Pack page

Each pack page should show:

- Name
- Description
- Publisher
- Version
- Compatibility
- Inputs
- Required secrets
- Required repo variables
- Files that will be created/changed
- Permission model
- Security notes
- Example rendered workflow
- Install count
- Rating/reviews later
- "Install" CTA

---

## 11. Action pack schema

Create a pack manifest named:

```txt
sh1pt.actionpack.yaml
```

Example:

```yaml
schemaVersion: 1
id: node-pnpm-ci
name: Node pnpm CI
description: Install a least-privilege Node/TypeScript CI workflow using pnpm.
version: 1.0.0
publisher: profullstack
visibility: public
license: MIT
categories:
  - ci
  - node
  - typescript
compatibility:
  providers:
    - github
  languages:
    - javascript
    - typescript
  packageManagers:
    - pnpm
  frameworks:
    - next
    - sveltekit
    - react
pricing:
  type: free
inputs:
  nodeVersion:
    type: string
    default: '22'
    description: Node.js version to install.
  installCommand:
    type: string
    default: pnpm install --frozen-lockfile
  typecheckCommand:
    type: string
    default: pnpm typecheck
  testCommand:
    type: string
    default: pnpm test
secrets: []
repoVariables: []
files:
  - source: workflows/ci.yml.hbs
    destination: .github/workflows/ci.yml
    mergeStrategy: replace-managed
policies:
  installMode: pull-request
  managedComment: true
  requiresReview: true
security:
  leastPrivilegePermissions: true
  pinThirdPartyActions: optional
  allowPullRequestTarget: false
  defaultTimeoutMinutes: 15
tests:
  fixtures:
    - name: basic-pnpm
      input: fixtures/basic-pnpm/input.json
      expectedFiles:
        - fixtures/basic-pnpm/.github/workflows/ci.yml
```

### 11.1 Schema requirements

- `id` must be lowercase kebab-case.
- `version` must be semver.
- `schemaVersion` must be an integer.
- `files[].destination` must not allow path traversal.
- `files[].destination` must be restricted to repo-local paths.
- For MVP, only allow destinations under:
  - `.github/workflows/`
  - `.github/dependabot.yml`
  - `.github/labeler.yml`
  - `.github/release-please.yml`
  - `.github/CODEOWNERS` only if explicitly approved
  - `docs/` snippets if user confirms
- Pack templates must not execute arbitrary code during rendering.
- Pack templates may use a safe templating language with whitelisted helpers.

### 11.2 Managed comments

Each generated workflow should include a managed comment:

```yaml
# Managed by sh1pt Actions Fleet
# pack: node-pnpm-ci@1.0.0
# install: sh1pt-actions-store
# hash: sha256:<rendered-template-hash>
```

This enables drift detection without hiding the generated code.

---

## 12. MVP scope

### 12.1 Local CLI MVP

Implement before full SaaS dashboard.

Capabilities:

- Load built-in action packs from the repo.
- Validate pack manifests.
- Detect local repo stack.
- Render pack templates.
- Show a dry-run diff.
- Write files locally only after confirmation or `--yes`.
- Audit local `.github/workflows/*.yml` files.
- Emit JSON output for agents.

Commands:

```bash
sh1pt build actions list
sh1pt build actions show node-pnpm-ci
sh1pt build actions plan node-pnpm-ci --repo .
sh1pt build actions install node-pnpm-ci --repo . --dry-run
sh1pt build actions install node-pnpm-ci --repo . --yes
sh1pt build actions audit --repo . --json
```

### 12.2 Cloud MVP

Capabilities:

- User signs in to sh1pt Cloud.
- User installs sh1pt GitHub App.
- sh1pt lists accessible repos.
- sh1pt detects repo stack for selected repos.
- User selects one pack and one repo.
- sh1pt opens a PR that adds/updates workflow files.
- sh1pt tracks PR URL and status.
- sh1pt stores pack installation metadata.
- sh1pt gates private repo installs by plan.

### 12.3 Dashboard MVP

Pages:

1. Actions Fleet overview
2. Repos list
3. Repo detail
4. Actions Store list
5. Pack detail
6. Install wizard
7. Install/PR history

### 12.4 Audit MVP rules

Implement these rules first:

| Rule ID | Finding | Severity |
|---|---|---|
| `missing-ci` | No CI workflow detected | medium |
| `unpinned-third-party-action` | Third-party action uses mutable tag | medium/high |
| `permissions-write-all` | Workflow or job uses `permissions: write-all` | high |
| `missing-permissions` | Workflow omits explicit `permissions` | medium |
| `pull-request-target` | Workflow uses `pull_request_target` | high unless allowlisted |
| `missing-timeout` | Job has no `timeout-minutes` | low/medium |
| `no-concurrency` | Workflow has no concurrency cancellation for PR builds | low |
| `old-checkout` | Uses old major of `actions/checkout` | low/medium |
| `secret-in-pr-context` | Suspicious secret usage on PR event | high |
| `shell-injection-risk` | Uses untrusted GitHub context directly in shell | high |

---

## 13. V1 scope

After MVP:

- Bulk install pack across multiple repos.
- Scheduled audits.
- Drift detection.
- Update PRs when pack versions change.
- Custom private org packs.
- Org-wide policy dashboard.
- Recommended packs based on repo detection.
- GitHub Marketplace listing for sh1pt GitHub App.
- Stripe/CoinPay paid plan enforcement.
- Pack publisher portal.
- Pack signing.
- Pack review workflow.
- Pack install analytics.
- Creator revenue share.
- Reusable workflow support for org-level central workflows.
- Secret/variable readiness checklist.
- sh1pt agent recipe that asks Claude Code/Codex to explain and improve failed CI.

---

## 14. Future scope

- GitLab and Gitea support.
- Enterprise policy enforcement.
- Auto-remediation PRs for existing workflow risks.
- "Golden path" repo templates.
- Organization-level required workflow reports.
- SSO/SAML enterprise plan.
- SOC 2 readiness controls.
- Webhook-triggered drift checks on repo push.
- Runner cost estimation.
- Hosted reusable workflow registry.
- "Agent repaired this workflow" telemetry.
- Marketplace for paid custom packs and templates.
- Integration with sh1pt `promote ship`, `scale deploy`, and `iterate agents` to generate workflows directly from a sh1pt manifest.

---

## 15. User journeys

### 15.1 Install one pack into one repo

1. User visits `Actions Fleet → Actions Store`.
2. User selects `node-pnpm-ci`.
3. User clicks `Install`.
4. User selects GitHub org and repo.
5. sh1pt detects stack and pre-fills inputs.
6. User reviews files to be changed.
7. User clicks `Open pull request`.
8. sh1pt creates branch and PR.
9. User reviews and merges in GitHub.
10. sh1pt marks pack as installed.

Acceptance criteria:

- The PR body explains the pack, files changed, required secrets, rollback instructions, and sh1pt metadata.
- Existing unmanaged files are not overwritten without conflict warnings.
- sh1pt stores the PR URL and installation record.

### 15.2 Bulk install security baseline

1. User visits `Actions Fleet → Repos`.
2. User filters repos missing security baseline.
3. User selects 15 repos.
4. User chooses `actions-hardening` or `codeql-baseline`.
5. sh1pt shows expected PR count.
6. User confirms.
7. sh1pt opens one PR per repo.
8. Dashboard tracks `opened`, `merged`, `closed`, `conflicted`, `failed`.

Acceptance criteria:

- Rate limits are handled gracefully.
- Failed repos show actionable errors.
- The operation can be retried idempotently.

### 15.3 Drift detection

1. A repo has `node-pnpm-ci@1.0.0` installed.
2. A maintainer manually edits `.github/workflows/ci.yml`.
3. sh1pt scheduled scan compares the managed hash.
4. sh1pt marks the repo as `drifted`.
5. User chooses `sync`.
6. sh1pt opens a PR with a clear diff.

Acceptance criteria:

- sh1pt does not silently overwrite local edits.
- Drift status differentiates "user edited managed file" from "pack update available."

### 15.4 Creator publishes a pack

1. Creator runs `sh1pt build actions pack init`.
2. Creator writes templates and `sh1pt.actionpack.yaml`.
3. Creator runs `sh1pt build actions pack validate`.
4. Creator publishes as private/public.
5. sh1pt performs schema, security, and file path checks.
6. Pack appears in the creator dashboard.

Acceptance criteria:

- MVP may stop at validation and first-party packs.
- V1 adds public publishing and review queue.

---

## 16. Architecture

### 16.1 Proposed packages/services

Add or extend:

```txt
packages/actions-fleet-core/
  src/action-pack/schema.ts
  src/action-pack/validate.ts
  src/action-pack/render.ts
  src/action-pack/catalog.ts
  src/repo-detect/detect.ts
  src/audit/rules/*.ts
  src/audit/run.ts
  src/diff/plan.ts
  src/types.ts

packages/actions/
  node-pnpm-ci/
    action.yml
    workflow.yml
    schema.json
    README.md
    sh1pt.actionpack.yaml
  bun-ci/
  python-fastapi-ci/
  rust-ci/
  actions-hardening/
  codeql-baseline/
  src/index.ts

packages/vcs/github/
  src/actions-fleet/list-repos.ts
  src/actions-fleet/create-branch.ts
  src/actions-fleet/upsert-files.ts
  src/actions-fleet/create-pr.ts
  src/actions-fleet/get-workflows.ts

services/actions-fleet-api/
  src/routes/*.ts
  src/github-app/*.ts
  src/jobs/*.ts
  src/db/*.ts

sites/sh1pt.com/
  app/actions-fleet/*
  app/actions-store/*
```

The exact paths should be adjusted after Claude Code inspects the current monorepo structure.

### 16.2 Data model

Minimum tables/collections:

#### `users`

Existing sh1pt users.

#### `github_installations`

```ts
type GitHubInstallation = {
  id: string
  userId: string
  githubInstallationId: number
  accountLogin: string
  accountType: 'User' | 'Organization'
  permissions: Record<string, string>
  repositorySelection: 'all' | 'selected'
  createdAt: string
  updatedAt: string
}
```

#### `repositories`

```ts
type Repository = {
  id: string
  installationId: string
  githubRepoId: number
  owner: string
  name: string
  fullName: string
  private: boolean
  defaultBranch: string
  archived: boolean
  detectedStack: RepoDetectedStack | null
  lastScannedAt: string | null
  riskScore: number | null
  createdAt: string
  updatedAt: string
}
```

#### `action_packs`

```ts
type ActionPack = {
  id: string
  slug: string
  publisherId: string
  name: string
  description: string
  visibility: 'public' | 'private' | 'unlisted'
  pricingType: 'free' | 'paid' | 'included'
  latestVersion: string
  verified: boolean
  createdAt: string
  updatedAt: string
}
```

#### `action_pack_versions`

```ts
type ActionPackVersion = {
  id: string
  packId: string
  version: string
  manifest: unknown
  templateBundleRef: string
  checksum: string
  status: 'draft' | 'review' | 'published' | 'rejected' | 'deprecated'
  createdAt: string
}
```

#### `repo_pack_installations`

```ts
type RepoPackInstallation = {
  id: string
  repositoryId: string
  packId: string
  packVersion: string
  installMode: 'pull-request' | 'local' | 'direct-commit'
  managedHash: string | null
  status: 'planned' | 'pr-opened' | 'installed' | 'drifted' | 'update-available' | 'failed' | 'removed'
  pullRequestUrl: string | null
  createdAt: string
  updatedAt: string
}
```

#### `repo_scans`

```ts
type RepoScan = {
  id: string
  repositoryId: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  summary: {
    riskScore: number
    findingCount: number
    highCount: number
    mediumCount: number
    lowCount: number
  } | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}
```

#### `repo_findings`

```ts
type RepoFinding = {
  id: string
  scanId: string
  repositoryId: string
  ruleId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  filePath: string | null
  line: number | null
  remediationPackId: string | null
  createdAt: string
}
```

### 16.3 GitHub App permissions

MVP GitHub App permissions should be minimal and transparent.

Required for MVP:

- Repository metadata: read
- Contents: read/write, for reading workflow files and creating branches/commits
- Pull requests: read/write, for opening remediation/install PRs
- Actions: read, for listing workflows and workflow status where needed

Optional for later:

- Checks: read, to show CI status
- Issues: write, only if sh1pt comments or creates issues
- Administration: read, only for repo settings and Actions policy checks
- Secrets: write, only if adding explicit secret-management features

Security principle:

- Use GitHub App installation tokens.
- Do not store installation access tokens long-term.
- Store installation ID and app credentials securely.
- Generate short-lived installation tokens when needed.
- Keep direct-commit mode disabled by default.

### 16.4 GitHub PR flow

Algorithm:

1. Resolve installation and repo.
2. Generate GitHub App installation token.
3. Fetch default branch SHA.
4. Create new branch:

```txt
sh1pt/actions/<pack-id>/<short-date-or-run-id>
```

5. Render pack files.
6. For each file:
   - Fetch existing file if any.
   - If generated/managed by same pack, update.
   - If unmanaged and path collision exists, mark conflict unless `--force`.
   - Upsert file on branch.
7. Create PR.
8. Write PR body with:
   - Pack details.
   - Files changed.
   - Required secrets/variables.
   - Security notes.
   - Rollback instructions.
   - sh1pt install metadata.
9. Persist PR record.
10. Subscribe to PR webhook events to update status.

### 16.5 Renderer

Renderer requirements:

- Deterministic output for the same pack/input/repo detection.
- Safe templating only.
- No arbitrary JS execution from third-party packs.
- Normalize line endings.
- Validate output YAML.
- Include managed comments when enabled.
- Compute content hash.
- Support dry-run diff.

### 16.6 Repo detection

Detect:

- Language: JS/TS/Python/Rust/Go/etc.
- Package manager: pnpm/npm/yarn/bun/pip/poetry/uv/cargo.
- Framework: Next, SvelteKit, Remix, Expo, FastAPI, Axum, etc.
- Existing `.github/workflows`.
- Existing deploy config: Vercel/Railway/Fly/Cloudflare.
- Existing release config.
- Existing lockfiles.
- Monorepo layout.

Output:

```ts
type RepoDetectedStack = {
  languages: string[]
  packageManagers: string[]
  frameworks: string[]
  hasWorkflows: boolean
  workflowFiles: string[]
  deployTargets: string[]
  packagePaths: string[]
  confidence: number
}
```

---

## 17. Security and trust requirements

### 17.1 User trust

- PRs first, direct commits later only if explicitly enabled.
- Every file change is visible before merge.
- Pack pages show required permissions, secrets, and generated files.
- sh1pt never hides workflow logic behind opaque generated code.
- Pack installs are reversible.

### 17.2 Workflow hardening

Packs should prefer:

- Explicit `permissions` blocks.
- Least-privilege `GITHUB_TOKEN` permissions.
- `timeout-minutes` on every job.
- `concurrency` cancellation for PR workflows.
- Avoiding `pull_request_target` unless the pack explicitly explains why.
- SHA pinning or immutable release references for third-party actions when feasible.
- OIDC-based cloud auth over long-lived cloud secrets where possible.
- No secret exposure on untrusted PR events.

### 17.3 Pack supply-chain controls

For third-party packs:

- Validate manifest schema.
- Reject dangerous file paths.
- Reject templates that try to render outside the repo.
- Require versioned immutable bundles.
- Require publisher identity.
- Add "verified publisher" program.
- Add security review for paid/public packs.
- Store checksums for published pack versions.
- Allow users to install only verified packs in org policy.

### 17.4 Data handling

- Do not store repository source code unless required for scan caching.
- Prefer metadata and file-level workflow contents only.
- Redact secrets in logs.
- Store GitHub App private key in secure secret manager.
- Installation access tokens must be short-lived and never persisted.

---

## 18. Billing and packaging

### 18.1 Pricing principles

sh1pt public pricing already presents cloud pricing around yearly and monthly plans. Actions Fleet should not create confusing "all features except this" messaging during early access.

Recommended beta packaging:

- Include basic Actions Fleet in sh1pt Cloud early access.
- Add usage limits for private repos and bulk operations.
- Charge higher tiers for organization-scale automation, drift detection, and scheduled scans.

### 18.2 Suggested tiers

| Tier | Price idea | Limits/features |
|---|---:|---|
| OSS | Free | Public repo scans, first-party free packs, local CLI installs |
| Cloud Basic | Included in existing sh1pt Cloud | 10 private repos, manual scans, single-repo PR installs |
| Fleet Pro | $49/mo or included in current monthly Cloud if preserving "all features" | 50 private repos, bulk installs, weekly drift scans |
| Fleet Team | $199/mo | 250 private repos, scheduled scans, org policies, custom private packs |
| Business | $499+/mo | Unlimited/custom, SSO, audit logs, policy enforcement, support SLA |

### 18.3 Marketplace economics

Future third-party pack marketplace:

- Free packs: no fee.
- Paid packs: sh1pt takes 15–25% platform fee.
- Private org packs: included in Team/Business.
- Verified publisher program: optional fee or manual review.

---

## 19. Success metrics

### 19.1 Activation

- GitHub App installations.
- Repos scanned per user.
- Time from sign-up to first PR opened.
- First PR merge rate.
- Packs installed per org.

### 19.2 Retention

- Weekly active scanned orgs.
- Drift checks completed.
- Update PRs opened/merged.
- Number of repos remaining under management.

### 19.3 Revenue

- Free-to-paid conversion after scanning private repos.
- Actions Fleet tier upgrades.
- Paid pack purchases.
- Marketplace GMV.
- Churn by repo count segment.

### 19.4 Quality

- PR creation success rate.
- Pack install conflict rate.
- False positive audit finding rate.
- Security issue reports per pack.
- Average time to remediate drift.

---

## 20. Acceptance criteria

### 20.1 Local CLI acceptance criteria

- `sh1pt build actions list` shows built-in packs.
- `sh1pt build actions show <pack>` prints metadata, inputs, generated files, and required secrets.
- `sh1pt build actions plan <pack> --repo .` detects stack and prints a planned file diff.
- `sh1pt build actions install <pack> --repo . --dry-run` writes nothing.
- `sh1pt build actions install <pack> --repo . --yes` writes generated files.
- `sh1pt build actions audit --repo . --json` emits machine-readable findings.
- Tests cover schema validation, rendering, path safety, and audit rules.

### 20.2 Cloud MVP acceptance criteria

- A user can sign in and install the sh1pt GitHub App.
- sh1pt can list repos accessible to the installation.
- sh1pt can scan selected repos and show basic detected stack.
- A user can select a pack and repo.
- sh1pt opens a PR adding/updating workflow files.
- PR status is tracked in sh1pt dashboard.
- Private repo installs are gated by subscription limits.
- GitHub installation tokens are not stored persistently.

### 20.3 Safety acceptance criteria

- Direct commit mode is disabled by default.
- Existing unmanaged workflow files are not overwritten silently.
- Pack paths cannot escape the repo.
- The renderer does not execute arbitrary third-party code.
- PR body discloses required secrets and permissions.
- Audit rules flag broad permissions and risky `pull_request_target` usage.

---

## 21. API sketch

### 21.1 REST routes

```txt
GET    /api/actions-fleet/installations
GET    /api/actions-fleet/repos?installationId=...
POST   /api/actions-fleet/repos/:repoId/scan
GET    /api/actions-fleet/repos/:repoId/scans/latest
GET    /api/actions-fleet/repos/:repoId/findings
GET    /api/actions
GET    /api/actions/:actionId
POST   /api/actions/:actionId/plan
POST   /api/actions/:actionId/install
POST   /api/actions/:actionId/sync
POST   /api/actions/publish
POST   /api/github/webhooks
```

### 21.2 Install request

```ts
type InstallPackRequest = {
  installationId: string
  repositoryIds: string[]
  packId: string
  version?: string
  inputs: Record<string, unknown>
  mode: 'pull-request'
  baseBranch?: string
  dryRun?: boolean
}
```

### 21.3 Install response

```ts
type InstallPackResponse = {
  operationId: string
  results: Array<{
    repositoryId: string
    status: 'planned' | 'pr-opened' | 'conflict' | 'failed'
    pullRequestUrl?: string
    conflicts?: Array<{ path: string; reason: string }>
    error?: string
  }>
}
```

---

## 22. UI requirements

### 22.1 Actions Fleet overview

Cards:

- Repos connected
- Repos missing CI
- High-risk workflow findings
- Drifted managed workflows
- Open sh1pt PRs
- Pack updates available

### 22.2 Repos table

Columns:

- Repo
- Visibility
- Detected stack
- CI status
- Security baseline
- Release workflow
- Deploy workflow
- Risk score
- Managed packs
- Last scan
- Actions

Filters:

- Missing CI
- High risk
- Drifted
- Private/public
- Language/framework
- Pack installed/not installed

### 22.3 Pack detail page

Sections:

- Overview
- Compatibility
- Inputs
- Required secrets
- Generated files
- Example output
- Security model
- Install button

### 22.4 Install wizard

Steps:

1. Select pack.
2. Select repos.
3. Confirm inputs.
4. Review file changes.
5. Open PRs.
6. Track results.

---

## 23. PR body template

```md
# sh1pt Actions Fleet: Install {{pack.name}}

This PR installs **{{pack.name}}** from the sh1pt Actions Store.

## Pack

- ID: `{{pack.id}}`
- Version: `{{pack.version}}`
- Publisher: `{{pack.publisher}}`

## Files changed

{{#each files}}
- `{{destination}}` — {{status}}
{{/each}}

## Required secrets

{{#if secrets.length}}
{{#each secrets}}
- `{{name}}` — {{description}}
{{/each}}
{{else}}
No new secrets required.
{{/if}}

## Security notes

- Install mode: pull request
- Managed by: sh1pt Actions Fleet
- Generated files include managed comments for drift detection.

## Rollback

Close this PR or revert the merge commit.

---

Generated by sh1pt Actions Fleet.
```

---

## 24. Implementation plan for Claude Code

### 24.1 First implementation slice

Start with local CLI + core library. This creates value quickly and gives a testable foundation before GitHub App/dashboard work.

Tasks:

1. Inspect current sh1pt package/CLI structure.
2. Add `actions-fleet-core` package or equivalent internal module.
3. Add action-pack manifest schema with Zod or existing validation style.
4. Add built-in pack catalog with at least:
   - `node-pnpm-ci`
   - `actions-hardening`
   - `dependabot-baseline`
5. Add safe renderer.
6. Add local repo detector.
7. Add audit rule engine with MVP rules.
8. Add CLI commands under `sh1pt build actions`.
9. Add tests.
10. Add docs and examples.

### 24.2 Suggested first issue list

#### Issue 1 — Add action pack schema

Acceptance:

- `sh1pt.actionpack.yaml` can be parsed and validated.
- Invalid semver, unsafe paths, missing required fields, and invalid categories fail tests.

#### Issue 2 — Add built-in pack loader

Acceptance:

- Built-in actions load from `packages/actions`, with each action as a top-level product directory.
- `list` and `show` commands display pack metadata.

#### Issue 3 — Add deterministic pack renderer

Acceptance:

- Renderer accepts pack + inputs + repo context.
- Renderer returns planned files with destination, content, hash, and conflict mode.
- Renderer cannot write outside repo.

#### Issue 4 — Add local install dry-run

Acceptance:

- `plan` prints file diffs.
- `install --dry-run` writes nothing.
- `install --yes` writes files.

#### Issue 5 — Add workflow audit engine

Acceptance:

- Finds `.github/workflows/*.yml`.
- Parses YAML safely.
- Emits findings for missing permissions, write-all, unpinned actions, pull_request_target, and missing timeouts.

#### Issue 6 — Add GitHub App PR backend

Acceptance:

- Given installation ID, repo, pack, and inputs, service creates branch and PR.
- Idempotent retries do not create duplicate PRs unnecessarily.

#### Issue 7 — Add dashboard MVP

Acceptance:

- User can view repo list, pack list, and install a pack into one repo by PR.

### 24.3 Claude Code prompt

Use this prompt with the PRD:

```txt
You are implementing the sh1pt Actions Store + Actions Fleet MVP in the profullstack/sh1pt repo.

Read this PRD first. Then inspect the current repository structure and identify the smallest implementation slice that preserves the existing sh1pt CLI architecture.

Constraints:
- Do not add a new top-level CLI verb unless absolutely necessary.
- Prefer `sh1pt build actions ...` commands.
- Start with local CLI functionality before cloud/dashboard work.
- Use TypeScript and the repo's existing package/test conventions.
- Add tests for schema validation, renderer safety, path traversal, and audit rules.
- Do not implement full billing in the first slice; add clear stubs/interfaces.
- Do not store GitHub installation tokens persistently.
- Pull-request install mode must be the default for remote repos.

First deliverable:
- Built-in pack schema + loader.
- `node-pnpm-ci` pack.
- Local dry-run rendering and install.
- Local workflow audit JSON output.
```

---

## 25. Technical references

Use these references during implementation:

- sh1pt homepage: https://sh1pt.com/
- sh1pt GitHub repo: https://github.com/profullstack/sh1pt
- GitHub Actions workflow syntax: https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions
- GitHub reusable workflows: https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows
- GitHub App permissions: https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app
- GitHub App installation authentication: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation
- GitHub Actions secure use: https://docs.github.com/en/actions/reference/security/secure-use
- GitHub Actions permissions API: https://docs.github.com/en/rest/actions/permissions
- GitHub Marketplace apps overview: https://docs.github.com/en/apps/github-marketplace/github-marketplace-overview/about-github-marketplace-for-apps
- Publishing GitHub Actions in Marketplace: https://docs.github.com/actions/creating-actions/publishing-actions-in-github-marketplace

---

## 26. Open questions

1. Should the public name be **Actions Store**, **Actions Fleet**, or both?
   - Recommendation: use **Actions Store** for catalog, **Actions Fleet** for paid fleet dashboard.
2. Should the CLI command be `sh1pt build actions` or `sh1pt iterate repo`?
   - Recommendation: `sh1pt build actions` for install/audit/sync. Keep `iterate agents` for agent-specific behavior.
3. Should early access users get Actions Fleet included automatically?
   - Recommendation: yes for beta, with generous limits.
4. Should third-party creators be allowed before the pack review system is mature?
   - Recommendation: no. Start first-party + private org packs.
5. Should packs use YAML manifests or TypeScript manifests?
   - Recommendation: YAML for public pack portability, TypeScript wrappers only for internal advanced packs.
6. Should the GitHub App be listed in GitHub Marketplace?
   - Recommendation: yes after MVP, once billing and onboarding are stable.
7. Should sh1pt support direct commits?
   - Recommendation: only for Business users who explicitly enable it; PR-first by default.

---

## 27. Recommended MVP decision

Build this as:

> **sh1pt Actions Fleet: powered by the sh1pt Actions Store.**

MVP should focus on:

1. Local CLI pack rendering.
2. A few excellent first-party packs.
3. GitHub App PR install flow.
4. Repo audit with security findings.
5. Paid gating by private repo count.

Avoid starting with a broad public marketplace. Prove demand with first-party packs and org-level workflow fleet management first.
