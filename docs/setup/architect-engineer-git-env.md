# architect-engineer git-env setup

One-time environment setup for any agent (architect or engineer) that
executes on the trunk-based multi-agent PR workflow introduced in
mission-45 (ADR-023 Phase 1). Covers:

1. Git identity + SSH (distinct per-role bot accounts)
2. Worktree-local config (when using `git worktree`)
3. `gh` CLI install + auth
4. Pre-commit hook activation
5. PR review flow — Option A v1.0 MVP
6. Web UI fallback (when `gh` is unavailable)
7. PR artifact conventions
8. Troubleshooting

This file is the authoritative onboarding reference. Future agents
arriving at the repo read it + install from it. If a setup step surprises
you, that is a bug in this doc — raise it on the architect/engineer
coordination thread.

---

## 0. Who this is for

- **Architect agent** (e.g. lily) — drafts methodology, reviews engineer PRs
- **Engineer agent** (e.g. greg) — drafts code / CI / docs, opens PRs for architect review
- **Future agents added per ADR-023 Phase 4** — same shape, different role-name

Humans (Director) don't typically need this doc — it describes agent-side
environment. Director admin actions (team creation, branch protection,
merge queue) live in `reports/task-344-v1-report.md` (mission-45 bundled
admin checklist).

---

## 1. Git identity + SSH

### 1.1 Why distinct identities

GitHub enforces that a PR author cannot self-approve their own PR. If
every agent auths as the same GitHub user (e.g. Director's personal
account), `gh pr review --approve` on your own PR is silently rejected,
and the branch protection gate stays red. CODEOWNERS routing likewise
only routes meaningfully when `@<org>/<role>` teams resolve to distinct
GitHub identities.

Solution: each role has a dedicated **bot GitHub account** added to the
matching `@<org>/<role>` team. mission-45 uses:

| Role | Bot account | Team |
|---|---|---|
| Architect | `apnex-lily` | `@apnex-org/architect` |
| Engineer | `apnex-greg` | `@apnex-org/engineer` |

Director creates the bot account + team membership via GitHub UI; see
admin checklist in `reports/task-344-v1-report.md`.

### 1.2 SSH key (one-time per machine)

Generate a dedicated SSH key per bot identity. The key file name matters
— the SSH config alias references it by filename.

```bash
# Replace <bot-name> with e.g. apnex-greg
ssh-keygen -t ed25519 -f ~/.ssh/github_<bot-name> -C "<bot-name>@github bot identity" -N ""
```

Add the `.pub` contents to the bot account's SSH settings at
`https://github.com/settings/keys` (logged in as the bot).

### 1.3 SSH config alias (one-time per machine)

SSH multiplexes keys to `github.com` via host aliases. Add to `~/.ssh/config`:

```sshconfig
Host github.com-apnex-greg
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_apnex_greg
  IdentitiesOnly yes
  IdentityAgent none
```

The `IdentitiesOnly yes` + `IdentityAgent none` pair is critical — without
them, ssh-agent's key preference can override the explicit IdentityFile
and you'll authenticate as the wrong bot (subtle silent-wrong-identity
failure mode). Mirror the block for each bot (`github.com-apnex-lily`).

Verify:

```bash
ssh -T git@github.com-apnex-greg
# Expected: Hi apnex-greg! You've successfully authenticated, ...
```

If this says `Hi apnex-lily` or `Hi <other-user>`, ssh-agent is offering
the wrong key — recheck `IdentitiesOnly yes` and run
`ssh -T -v git@github.com-apnex-greg` to see which key is being offered.

### 1.4 Remote URL + git identity

Point the repo remote at the aliased hostname, and set git user config
to the bot identity:

```bash
git remote set-url origin git@github.com-apnex-greg:apnex-org/agentic-network.git
git config user.name  "apnex-greg"
git config user.email "apnex-greg@users.noreply.github.com"
```

The `@users.noreply.github.com` email format is GitHub's reserved
per-user noreply — keeps commits linkable to the bot's GitHub profile
without exposing a real inbox.

Verify:

```bash
git remote -v
# Expected: origin  git@github.com-apnex-greg:apnex-org/agentic-network.git (fetch)
#           origin  git@github.com-apnex-greg:apnex-org/agentic-network.git (push)

git fetch origin
# Expected: silent success (no auth errors)
```

**Gotcha — SSH key works but push denied:**
If `ssh -T` succeeds but `git push` returns
`Permission to apnex-org/... denied to <bot>`, the bot account is
authenticated but its team lacks **Write** access on the repo. This is
a Director admin action — see `reports/task-344-v1-report.md` Step 1 /
Step 2 for the GitHub UI path.

---

## 2. Worktree-local config (when using git worktrees)

**Skip this section if you're using a single working tree.**

If multiple agents share a `.git` directory via `git worktree add` (e.g.
`agentic-network-lily` + `agentic-network-greg` on the same host),
**the shared `.git/config` is read by all worktrees.** Setting
`user.name` or `remote.origin.url` in one worktree via
`git config <key> <value>` silently mutates the shared config, and the
other worktree inherits your changes. Failure mode: your next commit is
authored as the other agent's identity, and `git push` fans out to both
remote URLs (because `url` is a multi-value key in git's config model).

Solution: enable git's **worktree-local config extension** and write
identity + remote URL to the worktree-scoped config file.

### 2.1 One-time per repo: enable the extension

```bash
git config --replace-all extensions.worktreeConfig true
```

This writes to the shared `.git/config` once. All worktrees inherit the
capability; each still reads its own config-worktree file.

### 2.2 Per-worktree: write identity + remote URL to the worktree config

From inside the worktree directory:

```bash
git config --worktree user.name  "apnex-greg"
git config --worktree user.email "apnex-greg@users.noreply.github.com"
git config --worktree remote.origin.url git@github.com-apnex-greg:apnex-org/agentic-network.git
```

This writes to
`.git/worktrees/<worktree-name>/config.worktree`, overriding any value
in the shared `.git/config`. Resolution precedence:
**worktree > local (shared `.git/config`) > global (`~/.gitconfig`)**.

### 2.3 Decontaminate the shared `.git/config`

If a prior agent wrote `user.name` / `user.email` / `remote.origin.url`
into the shared `.git/config`, remove those entries so only worktree
configs apply. From any worktree:

```bash
git config --unset-all user.name        2>/dev/null || true
git config --unset-all user.email       2>/dev/null || true
git config --unset-all remote.origin.url 2>/dev/null || true
```

Shared `.git/config` should contain no identity or remote-URL entries
after this — each worktree's `config.worktree` is the sole source of
truth for both. `git remote -v` in each worktree then shows a single
role-distinct URL pair.

### 2.4 Verify

```bash
git config user.name                              # returns bot name
git config user.email                             # returns bot email
git config remote.origin.url                      # returns aliased URL
git config --list --show-origin | grep -i user    # shows only worktree-config source
git remote -v                                     # single URL pair (no multi-URL fanout)
```

---

## 3. `gh` CLI install + auth

`gh` is GitHub's official CLI; the PR review flow (Section 5) uses it
extensively. Install paths vary by environment family.

### 3.1 Install

**Fedora / RHEL / CentOS** (uses `dnf`):

```bash
sudo dnf install gh
# If not in the default repos, add the GitHub CLI repo first:
#   sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
#   sudo dnf install gh
```

**Debian / Ubuntu** (uses `apt`):

```bash
# One-time repo add (from https://github.com/cli/cli/blob/trunk/docs/install_linux.md):
type -p curl >/dev/null || sudo apt install curl -y
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
  | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh
```

**macOS** (Homebrew):

```bash
brew install gh
```

**User-local, no sudo** (ephemeral envs, container sandboxes, CI images
where you can't touch system packages):

```bash
GH_VERSION="2.45.0"   # or pick latest from https://github.com/cli/cli/releases
ARCH="amd64"          # or arm64 / etc.
mkdir -p ~/.local/bin && cd /tmp
curl -sL "https://github.com/cli/cli/releases/download/v${GH_VERSION}/gh_${GH_VERSION}_linux_${ARCH}.tar.gz" -o gh.tar.gz
tar xzf gh.tar.gz
cp "gh_${GH_VERSION}_linux_${ARCH}/bin/gh" ~/.local/bin/gh
chmod +x ~/.local/bin/gh
rm -rf gh.tar.gz "gh_${GH_VERSION}_linux_${ARCH}"
# Ensure ~/.local/bin is on $PATH for your shell. If not:
#   echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
```

Verify:

```bash
gh --version
# Expected: something like "gh version 2.45.0 (2024-03-04)"
```

### 3.2 Authenticate

`gh` auth is separate from SSH git-push auth (SSH gates git protocol
via keys; `gh` gates REST/GraphQL via OAuth or Personal Access Tokens).

One-time interactive login, as the bot identity:

```bash
gh auth login
# Choose: GitHub.com
# Protocol: SSH (reuses your configured keys from Section 1)
# Upload SSH public key? No (the bot already has its key registered)
# Authenticate Git with your GitHub credentials? Yes
# Web browser / token: your choice
```

For **non-interactive** (CI / headless agents), prefer a Personal Access
Token with `repo` + `read:org` scopes:

```bash
echo "<YOUR-TOKEN>" | gh auth login --with-token
```

Verify:

```bash
gh auth status
# Expected: ✓ Logged in to github.com as apnex-greg (...)
#           ✓ Git operations for github.com configured to use ssh protocol.
```

If `gh auth status` shows the wrong account, `gh auth switch` or re-run
`gh auth login` for the correct bot identity.

---

## 4. Activate the pre-commit hook

The repo ships a `.husky/pre-commit` hook that blocks commits adding
files whose names match dangerous filename patterns
(`*.tfvars`, `*.env*`, `*.pem`, `credentials.*`, etc.). Activation is
**per-clone**, one-time:

```bash
scripts/setup-hooks.sh
# Expected:
#   setup-hooks: core.hooksPath set to .husky
#   setup-hooks: pre-commit secret-scan now enforced for this clone.
```

The script uses pure git (`core.hooksPath .husky`) — no `husky` npm
package dependency. Idempotent; safe to re-run.

Bypass path (emergency only, audit-visible in `git reflog`):
`git commit --no-verify`.

---

## 5. PR review flow — Option A v1.0 MVP

The coordination layer is **Hub thread_message**: the engineer notifies
architect via an ideation thread when a PR is ready; architect reads +
reviews via `gh`; architect's completion reply closes the coordination
loop. No webhook-to-Hub bridge is involved at v1.0 (that's Option B,
out of scope until Option A friction hits signal threshold).

### 5.1 Engineer opens a PR

```bash
git checkout -b agent-greg/mission-45-t5-pre-commit
# ... commits ...
git push -u origin agent-greg/mission-45-t5-pre-commit

gh pr create \
  --base main \
  --title "[mission-45] T5 — .husky/pre-commit hook" \
  --body-file /tmp/pr-body.md
```

Branch naming convention: `agent-<role-name>/<mission-or-scope-ref>`.
See Section 6 for PR title + body conventions.

### 5.2 Notify architect via Hub thread

After `gh pr create` returns a URL, open (or reply to) a Hub thread
with:

- **Title:** `[mission-45] PR #<N> ready — <short scope>`
- **Body:** the PR URL, the CI status (`gh pr checks <N>`), and a
  one-line scope summary

This is the architect's signal to pick up the review.

### 5.3 Architect reviews

```bash
gh pr view <N>                          # read title / body / state
gh pr diff <N>                          # inspect changes
gh pr checks <N>                        # CI status
gh pr review <N> --approve              # or --request-changes / --comment
# For changes requested:
gh pr review <N> --request-changes --body "Please fix X; see file Y"
```

When review is complete, architect replies on the Hub thread with the
review verdict (approved / changes requested / needs discussion). That
reply unblocks the engineer.

### 5.4 Engineer addresses + re-requests review

If changes were requested, engineer pushes follow-up commits to the
same branch (`git push`). PR auto-updates. Re-notify the architect via
the same Hub thread; architect re-reviews via same commands.

### 5.5 Merge via queue

Once approved + CI green:

```bash
gh pr merge <N> --merge-queue
# OR if the queue feature is GitHub-UI-only for your account:
# Just enable the PR for the queue via UI, and GitHub handles landing.
```

The merge queue rebases + re-runs CI before landing. Engineer watches
for queue completion; on landing, optionally notifies architect on the
thread that the work has shipped.

### 5.6 Close the thread

The Hub thread converges with a staged `close_no_action` (or
`update_mission_status` if the PR closes a mission) and a narrative
summary of the review cycle + landing.

---

## 6. Web UI fallback (when `gh` is unavailable)

If `gh` can't be installed or isn't working, the UI flow maps 1:1:

| `gh` command | Web UI equivalent |
|---|---|
| `gh pr create` | Navigate to branch on GitHub → **Compare & pull request** button |
| `gh pr view <N>` | `https://github.com/apnex-org/agentic-network/pull/<N>` |
| `gh pr diff <N>` | PR page → **Files changed** tab |
| `gh pr checks <N>` | PR page → **Checks** tab |
| `gh pr review <N> --approve` | PR page → **Files changed** → **Review changes** → **Approve** → Submit |
| `gh pr merge <N> --merge-queue` | PR page → **Add to merge queue** (after approval + green CI) |

Hub-thread notification convention is identical to the `gh` flow;
substitute the UI URL for the `gh pr view` output in the thread body.

---

## 7. PR artifact conventions

### 7.1 PR title

Format: `[mission-<N>] <task-ref> — <short scope>`

Examples:
- `[mission-45] T1 — .github/CODEOWNERS`
- `[mission-45] T4 — .github/workflows/secret-scan.yml (filename gate)`
- `[bug-42] Fix cascade-queue drain race`

Keep titles under ~70 characters; detail lives in the body.

### 7.2 PR body template

```markdown
## Summary

<1-3 bullets on what the PR does + why it exists>

## Scope

<Files changed + any non-obvious design choices>

## Verification

<Test commands run, smoke-test results, CI status>

## Refs

- Mission: mission-<N>
- Brief: docs/planning/...
- Task: task-<id>
- Related commits: ...

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### 7.3 Branch naming

Format: `agent-<role-name>/<mission-or-scope-ref>`

Examples:
- `agent-greg/mission-45-t5-pre-commit`
- `agent-lily/mission-45-t6a-skeleton`
- `agent-greg/bug-42-queue-drain-fix`

One branch per PR; avoid long-lived branches (trunk-based discipline
per ADR-023).

---

## 8. Troubleshooting

### 8.1 `ssh -T` says `Hi apnex-lily` when I expected `apnex-greg`

ssh-agent is offering multiple keys; GitHub matches on whichever key
authenticates first. Fix: ensure your SSH config block has both
`IdentitiesOnly yes` AND `IdentityAgent none`. Test:

```bash
ssh -T -v git@github.com-apnex-greg 2>&1 | grep -E "Offering|Hi "
# Expected: exactly one "Offering ..." line for github_apnex_greg
```

### 8.2 `git push` denies with "Permission denied to \<bot\>"

SSH auth succeeded (you're the right bot), but the bot's team doesn't
have **Write** permission on the repo. Director fix: GitHub repo
settings → Collaborators and teams → Add team → `@apnex-org/<role>` →
**Write** role. Reference: `reports/task-344-v1-report.md` Step 1.

### 8.3 `git push` fans out to two URLs (multi-URL fanout)

`git remote -v` shows multiple `push` entries. Root cause: `url` is set
in both shared `.git/config` and your worktree config. Fix:
Section 2.3 (decontaminate the shared `.git/config`).

### 8.4 My next commit is authored as the other agent

Worktrees share `.git/config` by default; the other agent's identity
leaked through. Fix: Section 2 (enable `extensions.worktreeConfig`
+ write identity to `--worktree` scope).

### 8.5 `gh auth status` shows I'm logged in as the wrong account

Run `gh auth logout`, then `gh auth login` and carefully pick the bot
identity. On systems with multiple configured hosts, check `gh auth
switch`.

### 8.6 Remote URL changed after org rename / transfer

When the repo moves (e.g. `apnex/foo` → `apnex-org/foo`), every
worktree needs:

```bash
git config --worktree remote.origin.url git@github.com-<bot>:<new-org>/<repo>.git
git fetch origin   # verify reachability
```

No history rewrite required; commits stay authored as they were.

### 8.7 `scripts/setup-hooks.sh` says ".husky/ not found"

You're not at the repo root, or the repo was cloned incompletely. Check
`pwd` shows the top-level and `.husky/pre-commit` exists.

---

## Refs

- Mission: mission-45 (M-Trunk-Migration-Infrastructure)
- ADR: ADR-023 Phase 1
- Methodology: `docs/methodology/multi-agent-pr-workflow.md` v1.0 (sibling
  doc authored in mission-45 Task 6)
- Retired methodology (reference): `docs/methodology/superseded/multi-branch-merge.md`
  (Superseded header landed with T6b)
- Admin checklist (Director): `reports/task-344-v1-report.md` (bundled
  team creation + branch protection + merge queue)
- Related commits: 231db16 (T1 CODEOWNERS), ddfc946 (T1 org amendment),
  c18deca (T4 secret-scan CI), b624dab (T5 pre-commit hook)

*Draft v1.0 authored 2026-04-23 by engineer (apnex-greg) for mission-45
Task 7. Architect reviews for workflow-alignment per brief §Task 7.*
