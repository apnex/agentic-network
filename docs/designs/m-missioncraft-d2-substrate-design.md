# M-Missioncraft-D2-Substrate — Design v5.0 DRAFT SCAFFOLD (Director-direct substrate-design simplification)

**Status**: **v5.0 DRAFT SCAFFOLD** — Survey-capture of Director-direct 2026-05-12 substrate-design directional disposition. Architect-side mid-mission re-scope; engineer-side implementation-spec to follow in subsequent passes before W3-new wave issuance.

**Composed from**: mission-78 W0-W2 + W2-extension shipped artifacts (`a4453e9` on `apnex/missioncraft` main) + dogfood discoveries (Fix #1-#4 substrate-asymmetries) + this 2026-05-12 Director-consult conversation.

**Supersedes for mission-78 scope**: the original mission-78 W3-W5 plan (bug-74 fix + IsoEng-removal-only + v1.1.0 ship). Path D2 native-substrate work (Fix #1-#4 at HEAD) STAYS — it generalizes to the simplified architecture and is load-bearing prep.

**Does NOT supersede**: `m-missioncraft-v1-design.md` v4.9 PATCH (mission-77 implementation-target for `@apnex/missioncraft@1.0.x`). v4.x reflects the dual-branch + multi-participant + coord-remote architecture that v5.0 simplifies away. v4.x stays as historical record of v1.0.x shipped state.

---

## §1 Director-direct disposition (2026-05-12 verbatim summary)

From operator-channel conversation 2026-05-12 (architect-Director bilateral substrate-design):

**Architectural target for `@apnex/missioncraft@1.2.0`**:

> Missioncraft will replace the "git dance" between Lily and Greg in production. The Hub / threads / network coordination layer all remain in place. Each agent will be a missioncraft participant on the same machine (current geometry) — though not always same-host long-term.

> We will use `mission/` not `wip/`.

> Missioncraft should commit/push a lock to the shared GIT repo on first writer latch. Any future missions default to read unless overridden.

> No coord-remote — just the repo URL that the reader and writer share.

> Read-write missions commit + push; read-only missions fetch + apply. No "multi-participant mode" toggle. Independent missions; cross-visibility via shared remote.

> Push cadence is config (`on-complete-only` / `every-Ns` / `on-demand`), not mode.

---

## §2 Architecture target (v5.0 vs v4.x delta)

| Concept | v4.x (mission-77 / v1.0.x) | v5.0 (mission-78 re-scoped / v1.2.0) |
|---|---|---|
| Operator workflow | Flow A (`git add` + `git commit` manual) OR Flow B (daemon-wip transparency); ambiguous | **Flow B canonical**; operator never runs git commands; daemon handles all |
| Branches per mission per workspace | TWO: `mission/<id>` (HEAD; operator-commit target) + `wip/<id>` (daemon-snapshot sidecar) | **ONE**: `mission/<id>` (HEAD; daemon-commit target; bypass-HEAD bypass-INDEX) |
| Multi-participant mission | Shared mission entity with `mission.participants[]` (writer + readers); `msn join` semantic | **Independent missions**; each agent owns its own mission; cross-visibility via shared repo URL + branch convention |
| In-flight sync mechanism | `coord-remote` (separate URL from upstream-repo) | **No coord-remote**; daemon pushes to shared repo URL (the upstream-repo); reader fetches from same URL |
| Push trigger | Multi-participant: wip-push to coord-remote at every daemon-tick. Solo-writer: no in-mission push (only at `complete`) | **`pushCadence` mission-config field** ∈ {`on-complete-only`, `every-Ns`, `on-demand`}; no "mode" toggle |
| Writer coordination across missions | None at substrate level; user-discipline | **Writer-lock primitive**: `refs/missioncraft/lock/<scope>` committed/pushed by writer at first-latch; heartbeat TTL refresh; `--force-writer` override |
| Read-only mode | Reader role in multi-participant mission; filesystem 0444; sync via coord-remote | **Read-only mission flag**; reader-daemon Loop B pulls from shared repo URL on source-branch; filesystem 0444 preserved |

---

## §3 Calibrations captured this session

1. **`feedback_substrate_extension_wire_flow_integration_test.md`** confirmed load-bearing — 466/466 unit/integration test net was necessary-but-insufficient at every step; architect-side scenario-02 dogfood was the dispositive gate. Surfaced Fix #3 + Fix #4 + Fix #5-debate + ultimately the substrate-design ambiguity.
2. **Synthetic engine-isolation tests mask SDK-internal-call-pattern defects** (4th retrospective beat). Tests on engine-impl directly don't catch defects in caller's choice of inputs.
3. **Synthetic tests mask DEFECTS-IN-THE-CALLER** (5th retrospective beat). Tests with hand-crafted inputs (e.g. squashCommit with wip-branch) don't catch when production caller passes different inputs (e.g. mission-branch).
4. **Fix-class-recursion pattern** — each substrate-fix exposes the next layer's defect. Pattern observable: Fix #3 (wip-orphan) → Fix #4 (untracked-overwrite) → Fix #5 (publish-headRef) → substrate-design ambiguity (dual-flow). Suggests deeper architectural drift; incremental fixes hit recursion-limit at architectural level.
5. **Engineer-side framing-discipline for Director-consult is load-bearing** (calibration #6 v2). When engineer surfaces "this might be Director-scope" on substrate-design ambiguity, architect MUST verify substrate-target-state-vs-mechanism distinction before autonomously routing around. Architect's earlier autonomous-resolution was over-confident; operator-direct correction needed.
6. **(NEW) Naming clarity at substrate boundaries**. `wip/<id>` was implementation-detail-leak; `mission/<id>` is operator-facing intent. Single-branch model + naming consolidation removes a cognitive load class.

---

## §4 Wave structure (re-scoped mission-78)

| Wave | Status | Notes |
|---|---|---|
| W0 — substrate-detect + msn version | ✓ shipped | Pre-Path-D2 prep |
| W1 — NativeGitEngine canonical | ✓ shipped | Fix #1 (resolveIdentity fallback) + Fix #2 (deleteBranch update-ref) shipped inline |
| W2 — Canonical-switch default | ✓ shipped | gitEngineProviderName 'native-git' default |
| W2-extension — Fix #3 + Fix #4 | ✓ shipped | commitToRef parent-linkage + squashCommit bypass-INDEX. Fix #5 ABANDONED (re-scope moots) |
| W3-new — Single-branch refactor | unissued | daemon commits to `mission/<id>`; drop `wip/<id>` |
| W4-new — Independent missions | unissued | drop `msn join` multi-participant; read-only mission + source-remote |
| W5-new — Drop coord-remote | unissued | single repo URL + push-cadence config |
| W6-new — Writer-lock primitive | unissued | `refs/missioncraft/lock/<scope>` + heartbeat TTL + `--force-writer` override |
| W7-new — IsoEng removal | unissued | drop isomorphic-git npm dep (was original W4) |
| W8-new — Closing audit + v1.2.0 ship | unissued | scenario doc reconciliation + npm publish |

---

## §5 Open questions for Design v5.0 ratification

Before W3-new wave issuance, architect-side resolves:

### §5.1 Writer-lock primitive details
- **Granularity**: per-scope (default Director-intent), per-repo, or per-base-branch? Default scope per Director-disposition; need to verify scope semantics under shared-repo case.
- **Lock-namespace**: `refs/missioncraft/lock/<scope>` is the proposed format. Alternatives: git-tag (`refs/tags/missioncraft-lock-<scope>`), git-notes, special-branch (`missioncraft-lock-<scope>`). Refs are atomic via push-with-lease; tags and branches have other semantics. Refs win on cleanliness.
- **TTL value**: 5 minutes proposed. Trade-off: too short → frequent heartbeat traffic; too long → stale-lock recovery slow. Resolve via Director-direct or default-with-config.
- **Heartbeat cadence**: how often does daemon refresh the lock-ref? Probably TTL / 3 (so 100s for 5min TTL). 
- **Override mechanism**: `--force-writer` flag + warning UX. UX: prompt operator to confirm via stdin? Or just emit stderr warning + proceed? Or require an additional `--i-understand-the-stale-lock-risk` ack?
- **Migration**: how do existing mission-78 sessions (no lock today) interact with the new lock at v1.2.0 release? Probably: locks are mission-config-versioned; pre-v1.2 missions don't acquire locks; v1.2+ missions do.

### §5.2 Push-cadence config defaults
- Default `pushCadence` for solo-writer (no reader expected): `on-complete-only` (matches v4.x solo-writer behavior; no GitHub-noise).
- Default for multi-participant scenarios: `every-Ns` with N = wip-cadence-ms (existing knob; default 30s). Or operator-config.
- Refs-namespace for non-final pushes: `refs/missioncraft/wip/<id>` (custom namespace) vs `refs/heads/mission/<id>` (visible to GitHub-CI). Custom namespace avoids CI/webhook noise but requires git-server-side config; visible namespace gets free git-tooling but pays noise. Resolve at Design ratification.

### §5.3 Read-only mission mechanics
- `msn start --read-only --source-remote <url> --source-branch <ref>`: explicit form
- OR: `msn join <mission-id>` → resolves source-remote + source-branch from Hub mission entity (Hub knows the writer-mission's repo URL + branch name from convention `mission/<missionId>`). This is cleaner.
- Reader-daemon Loop B pull mechanics: today fetches from coord-remote + applies via custom mechanism. Under v5.0: just `git fetch <repo-url> mission/<writer-mission-id>` periodically + `git reset --hard FETCH_HEAD` on the reader's local mission-branch. Need to verify working-tree-update semantics.

### §5.4 Backward compatibility
- mission-77's `@apnex/missioncraft@1.0.x` released as v1.0.0-v1.0.7 (deprecated). v1.1.0 SKIPPED (re-scope). v1.2.0 ships v5.0 architecture.
- Operators on v1.0.x stay on v1.0.x until they upgrade. No mid-mission migration support; missions started on v1.0.x complete on v1.0.x or get abandoned + restarted on v1.2.0.
- Engineer-runtime memory `feedback_operator_never_runs_git_commands.md` — retract or update post-v1.2.0 release.

### §5.5 Reader-mode without coord-remote: details
- Today coord-remote was the bulletin board. Under v5.0: shared repo URL is the bulletin board.
- Writer's daemon pushes `mission/<missionId>` to shared repo at cadence.
- Reader's `msn join <writer-mission-id>` creates reader-mission with source-remote=shared-repo + source-branch=`mission/<writer-mission-id>`.
- Reader's daemon polls + fetches; updates reader's local working tree.
- Push from reader: BLOCKED (read-only flag; daemon doesn't push; CLI refuses).

---

## §6 Implementation impact

Concrete change-set surface (informs W3-new through W8-new waves):

1. **`watcher-entry.ts:170`** — commitToRef target: `refs/heads/wip/<missionId>` → `refs/heads/mission/<missionId>`. Verify HEAD-stability semantics under this change.
2. **`missioncraft.ts:runPublishLoop`** — already squashes from `mission/<id>`; with W3-new, mission-branch actually has content. headRef debate dissolves.
3. **Mission config schema** — add `pushCadence`, `readOnly`, `sourceRemote`, `sourceBranch`, `scope` (if not already present) fields.
4. **Daemon push behavior** — read `pushCadence` from mission-config; behave accordingly.
5. **Lock-acquire primitive** — new mechanism in `msn start` (writer-flow): push `refs/missioncraft/lock/<scope>` with mission-id + agent-id + timestamp.
6. **Lock-release primitive** — in `msn complete` + `msn abandon`: delete `refs/missioncraft/lock/<scope>`.
7. **Lock-heartbeat** — daemon refreshes lock periodically.
8. **`msn join` semantic** — repurpose to: detect writer-mission via Hub; create read-only mission with source-remote+branch derived from writer-mission's repo URL.
9. **Multi-participant code paths** — DELETE `missioncraft.ts:1390+` (coord-remote push) + related reader-mode Loop B coord-remote logic. Replace with simpler shared-repo fetch.
10. **IsoEng** — drop entirely at W7-new (was original W4; cleaner under v5.0).
11. **Scenario docs** — scenario-01 + scenario-02 + scenario-04 (multi-participant) reconciled to v5.0 model.
12. **Tests** — bug-73 lifecycle tests refactored to Flow B; multi-participant tests refactored to independent-mission model; lock-primitive tests added.

---

## §7 Open governance items

- [ ] **Engineer-runtime memory reconciliation** — `feedback_operator_never_runs_git_commands.md` says "operator does only `git add` + `git commit` inside workspace". This is Flow A documentation. Under Flow B canonical, retract or update post-v1.2.0 ship. Defer to W8-new closing-audit.
- [ ] **Scenario doc reconciliation** — scenario-02 doc Step 5 says "operator does NOT run git add/commit/branch" (Flow B). Aligned with v5.0; remains canonical. Scenario-04 (multi-participant) needs substantial rewrite.
- [ ] **calibrations.yaml ledger** — calibrations 4, 5, 6 v2 captured in this design; need formal Director-direct or architect-Director-bilateral filing into `docs/calibrations.yaml` per CLAUDE.md calibration-ledger-discipline.
- [ ] **Survey skill engagement** — Phase 3 Survey methodology (`docs/methodology/idea-survey.md`) normally engaged at Idea→Design transition. Mission-78 re-scoping bypassed formal Survey (Director-direct directional intent given via conversation). Capture this in Phase 10 Retrospective: when is informal-Director-consult acceptable vs full-Survey required?

---

## §8 References

- **Mission entity**: `mission-78` (Hub) — re-scoped 2026-05-12; plannedTasks W0-W2 completed; W3-new through W8-new unissued.
- **Hub threads**:
  - thread-539 W0/W1 (closed)
  - thread-540 W1 cascade (closed)
  - thread-542 W2 (converged)
  - thread-543 W2-extension (closing pending engineer-turn; Fix #5 NOT shipping per re-scope)
  - thread-544 HALT/re-scope (bilateral-converged 2026-05-12T06:07:48Z)
- **apnex/missioncraft `main` SHA**: `a4453e9` (Fix #4 wave-close ship; LAST pushed; v5.0 work begins from here)
- **Architect-side memory**: `project_missioncraft_path_d2_native_substrate.md` (Path D2 directional); this design supersedes/extends for v1.2.0 substrate-design.
- **Engineer-side memory**: `feedback_test_caught_substrate_gap_default_disposition.md` (substrate-gap-vs-test-bug diagnostic; pair with architect-side `feedback_architect_bug_filing_needs_root_cause_verification.md`).
- **Methodology references**: CLAUDE.md v1.1; `docs/methodology/mission-lifecycle.md`; `docs/methodology/idea-survey.md`; `docs/methodology/strategic-review.md`.

---

## §9 Next steps

1. Architect-side flesh-out of §5 open questions (Design v5.0 RATIFICATION DRAFT)
2. Architect-Director bilateral on §5.1 writer-lock details (granularity + TTL + override) if needed
3. W3-new wave-issuance via Hub task entity (per mission-77 formal-wave-issuance pattern) post-Design ratification
4. Engineer Greg standby (Fix #5 patch discarded; main at `a4453e9`; 466/466 pass) until W3-new task issues

— Lily (architect; agent-40903c59; 2026-05-12T06:10:00Z AEST)
