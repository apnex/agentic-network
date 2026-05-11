# Missioncraft Complete/Abandon Mechanics Review

**Version**: v1.0 DRAFT
**Author**: Lily (architect; agent-40903c59)
**Date**: 2026-05-11
**Scope**: architect-side analysis of `msn complete` + `msn abandon` mechanics as shipped in `@apnex/missioncraft@1.0.5`; gaps surfaced via Director-side dogfood test 2026-05-11

---

## §1 Purpose + scope

Review terminal-state-action mechanics + workspace/config/lock lifecycle behavior. Output drives v1.0.6 patch cycle disposition + (potentially) v1.x roadmap refinements.

**In scope**:
- `complete` 8-step publish-flow + `abandon` 7-step teardown-flow
- Workspace + config + lockfile + name-symlink lifecycle at each path
- `--purge-config` + `--retain` flag semantics
- FSM-rejection error paths + operator-experience hazards
- Idempotency + recovery on mid-flight failure

**Out of scope**:
- `start` / `create` / `update` mechanics (covered separately if needed)
- Multi-participant `join`/`leave` mechanics (scenario 04 territory)
- Daemon-watcher internal mechanics (covered at mission-77 closing-audit §11)

---

## §2 Current behavior (v1.0.5)

### §2.1 `msn complete <id> <message> [--purge-config]`

8-step `in-progress | started → completed` transition:

1. Final cadence-tick → `publishStatus: 'tick-fired'`
2. SIGTERM daemon-watcher (60s timeout + SIGKILL fallback) → `'daemon-killed'`
3. Squash wip-commits into single commit with operator-supplied message
4. Push squash-commit to remote feature-branch (`mission/<id>` or similar)
5. Open PR from feature-branch → base-branch via gh CLI or GitHub API
6. Atomic-write `publishedPRs` array + `publishMessage` (immutable post-publish)
7. Lifecycle atomic-advance to `'completed'`
8. Release mission-lock + repo-locks
9. (if `--purge-config`) remove config YAML + name-symlink

**Pre-flight requirements**: lifecycle in `{in-progress, started}`; cannot complete `configured` (no work to publish) or terminal-states.

### §2.2 `msn abandon <id> <message> [--purge-config] [--retain]`

7-step `in-progress | started → abandoned` transition:

1. Final cadence-tick → `abandonProgress: 'tick-fired'`
2. SIGTERM daemon-watcher (60s timeout + SIGKILL fallback) → `'daemon-killed'`
3. Atomic-write `abandonMessage` (immutable post-record)
4. Release mission-lock + repo-locks
5. Per-repo local-branch cleanup
6. Atomic single-lock-cycle: workspace destroy (default; preserved if `--retain`) + lifecycle `'abandoned'`
7. (if `--purge-config`) remove config YAML + name-symlink

**Pre-flight requirements**: lifecycle in `{in-progress, started}`; cannot abandon `configured` (use manual delete or never-start), `completed` (irrelevant), or `abandoned` (already terminal).

### §2.3 Per-path persistence matrix

| Artifact | After `complete` (default) | `complete --purge-config` | After `abandon` (default) | `abandon --retain` | `abandon --purge-config` |
|---|---|---|---|---|---|
| Workspace dir | **preserved** | preserved | **destroyed** | **preserved** | destroyed |
| Config YAML | preserved | **removed** | preserved | preserved | **removed** |
| Name-symlink | preserved | **removed** | preserved | preserved | **removed** |
| Lockfile | unlinked | unlinked | unlinked | unlinked | unlinked |
| `msn show <id>` | works (lifecycle `completed`) | error (not found) | works (lifecycle `abandoned`) | works | error (not found) |
| `msn list` row | present | removed | present | present | removed |
| `msn workspace <id>` | path returned | error (config gone) | error (terminal-state-guard) | path returned | error (config gone) |
| Re-startable? | no (terminal FSM) | no (config gone) | no (terminal FSM) | no | no (config gone) |

---

## §3 Gaps identified

### G1 — Default workspace handling asymmetry (intentional?)

`complete` preserves workspace by default; `abandon` destroys by default. Intent makes sense (inspect-success vs cleanup-failure) but no symmetric inverse flag exists:
- `abandon --retain` preserves workspace post-abandon (exists)
- `complete --purge-workspace` would destroy workspace post-complete (**DOES NOT EXIST**)

Operator has no way to clean up post-complete workspace in one operator-action; must manually `rm -rf ~/.missioncraft/missions/<id>/`.

### G2 — No retroactive cleanup verb

After terminal-state (`completed` or `abandoned`) without `--purge-config`, mission's config + name-symlink persist indefinitely. No first-class `msn delete <id>` to retroactively clean up. Operator must:
- (a) re-run `abandon --purge-config` → BUT this FSM-rejects (already terminal)
- (b) manually `rm` files from `~/.missioncraft/config/missions/`

**Tracked as**: `idea-275` (filed 2026-05-11).

### G3 — Progress callback fires pre-FSM-validation

`onProgress` callback (idea-273 shipped v1.0.5) fires BEFORE FSM-state check. Operator sees `[final-tick] flushing final wip-commit...` line even when action will be rejected immediately. Spurious output before error.

**Tracked as**: `bug-68` (filed 2026-05-11).

### G4 — FSM-rejection errors offer no workaround

Error message `error: requires lifecycle 'in-progress' or 'started' (current: 'abandoned')` is technically correct but offers no path forward. Operator at dead-end with no actionable hint.

**Tracked as**: `bug-69` (filed 2026-05-11).

### G5 — Cwd-rug-pull hazard on abandon

If operator's shell is `cd`'d inside the workspace when `abandon` runs, the destroy-workspace step pulls the rug — shell's `uv_cwd` becomes invalid; every subsequent command (including `npm`, `cd`) fails with ENOENT. **Live witnessed 2026-05-11 during Director dogfood test.**

**Mitigation options**:
- (a) `abandon` checks if `process.cwd()` is inside the workspace and warns: `hint: cd out of '<workspace-path>' before destroying`
- (b) `abandon` silently `chdir`'s to workspace's parent before destroying (silent + safe)
- (c) Document in operator-facing docs as known-hazard (least effort; least friendly)

**Recommendation**: (b) — silent + safe; no operator-action required.

**Tracked as**: `bug-70` (pending Director-disposition; not yet filed).

### G6 — Name-collision post-terminal

If `msn create --name foo` then `msn abandon foo "msg"` (no `--purge-config`), the name-symlink at `.names/foo.yaml` persists. Can operator `msn create --name foo` again? Or does the symlink conflict? **Unverified empirically**.

**Recommendation**: verify behavior + document; if conflict-blocking, document the workaround OR file as bug.

### G7 — Scope-id reference cleanup

If mission has `scope-id: scp-X` reference, and operator runs `abandon --purge-config`:
- Mission config + symlink removed ✓
- Scope's reference-count / referencing-missions registry — **UNCLEAR if updated**

**Recommendation**: verify scope-side reference-tracking behavior + document or fix.

### G8 — Mid-flight failure recovery

If `complete` fails at Step 5 (PR-open via gh CLI or GitHub API fails — network error, rate-limit, auth):
- Steps 1-4 already completed (daemon-killed, squash-committed, push-landed)
- Step 5 fails → no PR opened
- Step 6 atomic-write SHOULD NOT fire (publishedPRs would be empty/incomplete)
- Step 7 lifecycle advance SHOULD NOT fire (still in `started`)
- **UNCLEAR what state mission is left in; is operator able to retry `complete`?**

**Recommendation**: verify recovery semantic; document explicitly. If retry-on-fail not supported, this is a substrate-gap requiring fix.

### G9 — `--retain` discoverability

`--retain` flag is listed in `msn abandon --help` but operator-experience suggests it's rarely-used. Two questions:
- Do operators discover it when they need it?
- Should it apply to `complete` too (G1)?

**Recommendation**: hold pending G1 disposition.

---

## §4 Recommendations

### R1 — Symmetric flag UX (v1.0.6 candidate)

Add `complete --purge-workspace` flag for symmetric workspace cleanup at terminal-action-time. Operator-experience: `complete` defaults to preserve (current); flag opts in to destroy. Mirrors `abandon` (default destroy; `--retain` opts out).

```
msn complete <id> <msg>                          # workspace preserved (current default)
msn complete <id> <msg> --purge-workspace        # workspace destroyed at complete-time (NEW)
msn complete <id> <msg> --purge-config           # config removed (current)
msn complete <id> <msg> --purge-workspace --purge-config  # full cleanup at complete-time
```

**Fix-scope**: ~20-30 LOC. Add flag-parse + workspace-destroy invocation (reuse abandon Step 6 substrate).

### R2 — `msn delete <id|name>` retroactive cleanup (v1.0.6; idea-275)

Implement per filed idea. Validates terminal-state; performs config + symlink + orphaned-workspace + orphaned-lockfile cleanup. Confirmation-prompt convention (`--yes` flag or interactive y/N).

### R3 — Pre-flight FSM validation discipline (v1.0.6; bug-68)

SDK methods (`Missioncraft.complete()` + `Missioncraft.abandon()` + `Missioncraft.start()`) MUST validate FSM-state BEFORE the first `onProgress` callback fires. Idempotent rule: progress events represent ACTIVE work; no progress emitted for rejected actions.

### R4 — FSM-rejection error hints (v1.0.6; bug-69)

Extend CLI dispatch catch-block (already adds `hint:` for name-not-found per bug-67 v1.0.5) to FSM-rejection errors. Per-verb hint-content audit:
- `abandon` on terminal → suggest `msn delete <id>` (post-idea-275 ship) or manual rm
- `complete` on terminal → same
- `complete` on `configured` → suggest `msn start <id>` first
- `start` on non-`configured` → suggest `msn show <id>` to inspect lifecycle
- `tick` on terminal → suggest checking lifecycle

### R5 — Cwd-rug-pull guard (v1.0.6; bug-70 pending file)

`abandon` checks if `process.cwd()` is inside the workspace it's about to destroy. Pre-emptive `chdir(parent)` before workspace destroy. Silent + safe; no operator-friction.

```typescript
// in abandon() Step 6, BEFORE workspace destroy:
const workspacePath = resolveWorkspacePath(id);
if (process.cwd().startsWith(workspacePath)) {
  process.chdir(path.dirname(workspacePath));
}
// proceed with destroy...
```

### R6 — Mid-flight `complete` failure recovery (v1.0.6 OR v1.0.7 — investigation needed)

Audit current behavior:
- Where does mission state land if Step 5 (PR-open) fails?
- Can operator retry `complete`?
- If retry impossible, is there a recovery verb (e.g., `msn rescue <id>`)?

**Pre-audit hypothesis**: this is a substrate-currency gap; likely needs fix. May warrant Survey-class engagement if substantial.

### R7 — Verify + document G6 + G7 (name-collision + scope-ref)

Empirical verification pass:
- Create + abandon (no purge) + re-create with same name → does it conflict?
- Create with scope-id + abandon --purge-config → does scope-side ref-tracking update?

If either is broken: file as bugs. If both work as designed: document in scenario 01 §A flag-variants or scenario 02 multi-mission section.

---

## §5 Open architect-questions

**Q1** — Should `complete` default to destroying workspace (consistent with `abandon`) or preserving (current)? Director's intent on operator-experience here.

**Q2** — Should `--purge-config` + `--purge-workspace` be unified into a single `--purge` (all-or-nothing) OR remain granular?

**Q3** — Confirmation-prompt UX for `msn delete`: interactive y/N (operator-friendly) OR `--yes` flag required (script-friendly)? Both? Operator-config setting?

**Q4** — Does `msn delete` warrant a `--force` flag for non-terminal missions (bypasses FSM check)? Or strict terminal-only?

**Q5** — Should the scope-id reference-cleanup (G7) be automatic (mission delete → scope ref decrement) or operator-manual (`msn update <mission-id> scope-id ""` first)?

---

## §6 Hub-tracked items + dispositions

| Hub-ID | Gap | Status | v1.0.6 candidate? |
|---|---|---|---|
| bug-68 | G3 (progress pre-FSM) | open | yes |
| bug-69 | G4 (FSM-rejection hints) | open | yes |
| bug-70 | G5 (cwd-rug-pull guard) | **pending file** | yes (if Director-approved) |
| idea-275 | G2 (`msn delete` verb) | open | yes |
| — | G1 (`complete --purge-workspace`) | **not yet filed** | yes |
| — | G6 (name-collision verify) | **investigation pending** | — |
| — | G7 (scope-ref cleanup verify) | **investigation pending** | — |
| — | G8 (mid-flight failure recovery) | **audit pending** | — |

**v1.0.6 patch cycle scope** (proposed):
- bug-68 + bug-69 + bug-70 + idea-275 + new bug for G1
- ~150-250 LOC + ~20-30 tests
- Investigation pass for G6 + G7 + G8 BEFORE cycle starts (architect-side; ~30min)

---

## §7 Director-engagement points

This review awaits Director-ratification on:
- **Q1-Q5** above (architect-questions; can be addressed inline OR via review-ratify thread)
- **File bug-70 + new bug for G1?** — pending approval
- **v1.0.6 scope-disposition**: ship all 5+ items as single bundle (per v1.0.5 precedent), OR split?

— Lily (architect; agent-40903c59)
