# M-Local-FS-Cutover — Operator Drill Procedures

**Mission:** mission-48 M-Local-FS-Cutover (T3 — Dogfood validation + Hub-restart-mid-mission readback assertion + live rollback drill).
**Audience:** operator (Director or whoever owns the laptop-Hub container lifecycle).
**Engineer-side scope:** documentation + container-rebuild verification + dogfood evidence.
**Operator-side scope:** live execution of the drills below; capture outputs back via thread-307 or PR amendment.

This doc is the T3 deliverable. The DRILL EXECUTION is operator-side per Director's α-path call on thread-307 round 3 — engineer's own MCP session is bound to the running Hub, so engineer cannot safely restart it without losing the coordination channel. Procedures here are "exec these commands; capture outputs"; outputs land back via thread-307 or as a follow-up PR amendment.

After all three drills land, mission-48 closes via T4 (closing hygiene) + architect status flip → `completed`.

---

## 0. Pre-flight — container rebuild

The current `ois-hub-local` container on the operator's machine is on the **pre-mission-48 image** (built 2026-04-24 02:46 UTC; STORAGE_BACKEND=gcs, no bind mount, no uid override). Mission-48's T1/T2b/T2c additions are merged on `main` but not yet baked into a runnable image.

### 0.1 Rebuild from current main

Engineer-verified: `scripts/local/build-hub.sh` is structurally clean from current main HEAD (`bash -n` passes; `deploy/env/prod.tfvars` is populated; gcloud SDK 512+ installed locally; no missing dependencies).

Operator command (from a clean clone or pulled-up worktree of `agentic-network` at current main HEAD `8c420c7` or later):

```bash
OIS_ENV=prod scripts/local/build-hub.sh
```

**What this does:** invokes Cloud Build over the local `hub/` directory; pushes the resulting image to the env's Artifact Registry as `:latest`; pulls back to the host; tags locally as `ois-hub:local` (single-tag policy per `start-hub.sh:148-161` one-hub-at-a-time).

**Verification post-build:**
```bash
docker image inspect ois-hub:local --format '{{.Created}} {{.Id}}'
# Expect: timestamp == today; SHA != 7601261e8…  (the old pre-mission-48 image SHA)
```

### 0.2 Pre-launch: bootstrap the local-fs state directory

Before Hub starts on `local-fs` default, the `${REPO_ROOT}/local-state/` directory needs to be populated from GCS + carry the `.cutover-complete` sentinel (T2b's bootstrap-required guard refuses startup otherwise).

```bash
# One-time bootstrap (idempotent re-run is safe):
scripts/state-sync.sh
# Expected output trail:
#   [state-sync] Direction: forward
#   [state-sync] Source: gs://ois-relay-hub-state
#   [state-sync] Target: <repo>/local-state
#   [state-sync] Syncing (parallel, -d deletes target-only files...)
#   [state-sync] Verifying set-equality (post-sync invariant)...
#   [state-sync] Invariant green: <N> key(s) match across GCS + local.
#   [state-sync] Sentinel written: <repo>/local-state/.cutover-complete
#   [state-sync] Done: <N> file(s), <SIZE> local total
```

Verify the sentinel:
```bash
cat local-state/.cutover-complete
# Expect: direction=forward; timestamp_utc=<now>; gcs_source=gs://ois-relay-hub-state; ...
```

### 0.3 Stop the old (pre-mission-48) container

```bash
docker stop ois-hub-local && docker rm ois-hub-local
# (or: docker rm -f ois-hub-local)
```

### 0.4 Start the new container against local-fs

`scripts/local/start-hub.sh` (mission-48 T2b) defaults `STORAGE_BACKEND=local-fs`, so:

```bash
OIS_ENV=prod scripts/local/start-hub.sh
# Expected output trail:
#   [start-hub] OIS_ENV:      prod
#   [start-hub] Image:        ois-hub:local
#   [start-hub] Container:    ois-hub-local-prod        ← NEW NAMING (mission-46 T1)
#   [start-hub] Port:         8080:8080
#   [start-hub] Backend:      local-fs                  ← T2b default flip
#   [start-hub] State dir:    <repo>/local-state (bind-mounted; uid/gid <id>:<id>)
#   [start-hub] SA key:       <path>
#   [start-hub] Watchdog:     false
#   [start-hub] Waiting for health ...
#   [start-hub] Healthy: {"status":"ok",…}
```

If the Hub fails to start with FATAL on uid/gid mismatch (`/local-state not writable…`), see deploy/README §Local-fs Hub state directory bullet on uid/gid handshake — pre-flight should have caught this; if it surfaces, the bind-mount + `-u` flag setup needs operator-side investigation.

If the Hub fails to start with FATAL on missing sentinel (`cutover sentinel missing at /local-state/.cutover-complete`), §0.2 wasn't completed — re-run `scripts/state-sync.sh` to bootstrap.

---

## 1. Dogfood — continuous-validation evidence

**Honest scope:** the dogfood for mission-48 has been my (engineer-side) MCP traffic across the mission's 5+ tasks. That traffic exercises the Hub data plane under realistic agentic load — but it ran on **the GCS-deployed pre-mission-48 image**, not the local-fs cutover path. This evidence proves the Hub data plane is robust under realistic load; it is **not** a substitute for §2's Hub-restart-mid-mission readback assertion (which is the only thing that proves the local-fs cutover specifically).

### 1.1 Mission-48 entity-type exercise enumeration

Across mission-48 T1 → T2c (engineer-side), the following Hub state operations fired through MCP — counts approximate (each task report + thread reply + task ack = at least one Hub write):

| Entity type | Operations exercised | Counts (approx) |
|---|---|---|
| `task` | `get_task` (per task issuance) + `create_report` (per task) | 5 tasks issued (task-355…359) + reports for each + task-status flips |
| `thread` | `get_thread` + `create_thread_reply` + thread-message dispatches | 3 active threads (thread-303 design, thread-306 + thread-307 PR coordination); ~10 round-replies across mission-48 |
| `mission` | implicit via correlationId="mission-48" on every task + thread + cascade | 5 tasks correlated + thread routing + cascades from earlier design rounds |
| `audit` | `auditStore.logEntry` fires on every Hub write (cascade gate, task transitions, thread flips, etc.) | ~60+ entries (one per write, conservatively) |
| `notification` | SSE dispatches on thread-message + task-issued + report-created | every cross-role dispatch — ~20+ |
| `pendingAction` | comms-reliability layer: every owed-response dispatched via PendingAction queue | ~10+ enqueue/ack cycles |
| `engineerRegistry` (Agent) | M18 handshake + session resolution | every MCP session attach |

**What this proves:** the Hub data plane (Repository pattern, cascade, dispatch, M18) handles realistic agentic load without state corruption or dispatch loss across multi-hour wall-clock + multi-hundred Hub operations.

**What this does NOT prove:** local-fs durability across a Hub container restart. That's what §2 verifies — and §2 must be executed against the rebuilt image (per §0) for the proof to be on the cutover path rather than the legacy GCS path.

---

## 2. Hub-restart-mid-mission readback assertion (load-bearing)

**Goal:** prove that the local-fs StorageProvider preserves Hub entity state across a `docker stop && docker start` cycle with no loss, no corruption, no duplication.

**Pre-conditions:** §0 complete (rebuilt image; bootstrapped `local-state/`; new container `ois-hub-local-prod` healthy on local-fs).

### 2.1 Capture pre-restart state

For each entity type, list current entries via MCP tooling AND verify the disk file count matches:

```bash
# Hub-API enumeration (via MCP — operator runs from any tool that talks to the Hub):
#   list_tasks      → count tasks
#   list_threads    → count threads
#   list_missions   → count missions
#   list_audit_entries → count audit entries
#   list_ideas      → count ideas
#   list_bugs       → count bugs

# Disk-side enumeration (pure file count under each entity's storage path):
cd <repo>/local-state
find tasks/ -type f | wc -l
find threads/ -type f | wc -l
find missions/ -type f | wc -l
find audit/v2/ -type f | wc -l
find notifications/v2/ -type f | wc -l
find ideas/ -type f | wc -l
find bugs/ -type f | wc -l

# Save these counts in a side file (e.g., /tmp/pre-restart-counts.txt) for §2.3 comparison.
```

### 2.2 Stop + restart Hub

```bash
docker stop ois-hub-local-prod   # graceful stop; waits for in-flight requests to drain
docker start ois-hub-local-prod  # restart against the same bind-mounted state
# Wait for /health to come back online:
until curl -sf http://localhost:8080/health >/dev/null; do sleep 1; done
echo "Hub healthy post-restart"
```

### 2.3 Capture post-restart state + assert exact set-equality

Re-run the §2.1 enumeration commands. Compare against the saved pre-restart counts:

```bash
diff <(cat /tmp/pre-restart-counts.txt) <(... post-restart enumeration ...)
# Empty diff = invariant held: no entities lost, no entities duplicated, no entities corrupted.
```

**Stricter check** (recommended): for each entity type, verify exact ID-set equality, not just count:

```bash
# Pre-restart:
( cd local-state && find tasks/ -type f | sort ) > /tmp/pre-tasks.txt
# ... same for each entity type ...

# Post-restart:
diff /tmp/pre-tasks.txt <(cd local-state && find tasks/ -type f | sort)
# Empty diff = exact set match.
```

Counts being equal but IDs differing would indicate corruption (entities renamed mid-restart, or a reaper running mid-restart silently swapping entries) — the ID-set check catches this.

### 2.4 Expected outcome

- All entity-type counts match pre/post-restart
- All entity-type ID sets match pre/post-restart
- Hub /health returns 200 within ~5s of `docker start`
- `docker logs ois-hub-local-prod --tail 50` shows clean startup with no FATAL or ERROR

If any of the above fails, capture the failure in the T3 follow-up + halt — do not proceed to §3 until the readback drill is green. A failed readback indicates the local-fs cutover has a durability bug not yet caught by the mission-49 Repository migrations or T1/T2a validation.

---

## 3. Live rollback drill

**Goal:** prove that the rollback path (post-cutover writes pushed to GCS via T2c, then env-var flip + restart) recovers state to a GCS-backed Hub without data loss.

**Pre-conditions:** §2 complete + green (Hub on local-fs, durable across restart).

### 3.1 Make a post-cutover write

Create any new entity that lands in local-fs. Easiest: use existing MCP tooling to file a no-op idea:

```bash
# Via MCP (any client talking to the Hub on port 8080):
#   create_idea({ text: "mission-48 T3 rollback-drill marker; safe to dismiss", tags: ["test","mission-48-t3"] })
# This produces idea-N for some new N. Note the ID.
```

Verify the new entity exists in local-fs:
```bash
ls local-state/ideas/
# idea-<N>.json should be present.
grep -l "rollback-drill marker" local-state/ideas/*.json
```

### 3.2 Run reverse-sync (T2c — push local-fs to GCS)

```bash
# REQUIRES --yes — this is the rollback path; --yes confirms the canonical
# GCS state will be overwritten from local-fs.
scripts/state-sync.sh --reverse --yes
# Expected output trail:
#   [state-sync] Direction: reverse
#   [state-sync] Source:    <repo>/local-state
#   [state-sync] Target:    gs://ois-relay-hub-state
#   [state-sync] WARNING: reverse direction will overwrite canonical GCS state.
#   [state-sync]          --yes confirmation received; proceeding.
#   [state-sync] Syncing ...
#   [state-sync] Verifying set-equality (post-sync invariant)...
#   [state-sync] Reverse-sync complete; local sentinel unchanged at: <repo>/local-state/.cutover-complete
#   [state-sync] Invariant green: <N> key(s) match across GCS + local.
```

Verify the new entity is now in GCS:
```bash
gsutil ls gs://ois-relay-hub-state/ideas/idea-<N>.json
# Expect: file exists in GCS.
```

Verify the sentinel did NOT cross to GCS (T2c contract):
```bash
gsutil ls gs://ois-relay-hub-state/.cutover-complete 2>&1
# Expect: 'CommandException: One or more URLs matched no objects.' OR similar — sentinel is local-only.
```

### 3.3 Stop Hub + flip env-var + restart on GCS backend

```bash
docker stop ois-hub-local-prod && docker rm ois-hub-local-prod

# Restart with explicit STORAGE_BACKEND=gcs override:
STORAGE_BACKEND=gcs OIS_ENV=prod scripts/local/start-hub.sh
# Expected output trail:
#   [start-hub] Backend:      gcs                       ← rolled back from local-fs
#   [start-hub] GCS bucket:   ois-relay-hub-state
#   [start-hub] Container:    ois-hub-local-prod
#   [start-hub] Healthy: {"status":"ok",…}
```

### 3.4 Verify the post-cutover write is preserved on GCS-backed Hub

```bash
# Via MCP:
#   get_idea({ ideaId: "idea-<N>" })
# Expect: the idea record returns successfully with the "rollback-drill marker" text.
```

If the idea is found, the rollback drill is GREEN — post-cutover writes are recoverable via the reverse-sync + env-var-flip + restart sequence.

If the idea is NOT found (404 or empty), the reverse-sync didn't actually push the entity to GCS, OR GCS is the wrong bucket — investigate before declaring rollback verified.

### 3.5 Expected outcome

- `idea-<N>` exists in GCS post-reverse-sync
- Hub running on gcs-backend can return `idea-<N>` post-restart via `get_idea`
- Hub /health is 200; no FATAL on the gcs path
- The sentinel was NOT pushed to GCS

### 3.6 Restore to forward (laptop-Hub default)

After the drill verifies green, return to the local-fs default for normal operation:

```bash
docker stop ois-hub-local-prod && docker rm ois-hub-local-prod
# (Optional: re-bootstrap if you've drifted; otherwise the local-state already has a fresh sentinel from §0.2)
OIS_ENV=prod scripts/local/start-hub.sh
# Backend: local-fs (default since T2b)
```

---

## 4. Reporting back

After executing §1 / §2 / §3 (or any subset), capture outputs back to:

- **thread-307** as a reply on the PR-coordination thread, OR
- An amendment commit on the T3 PR (or its successor), OR
- The mission-48 retrospective (architect's separate doc) if drills happen post-mission-close

The architect's α-path call (thread-307 round 3) explicitly accepts that drill execution may land asynchronously after T3+T4 PRs merge; mission status flips to `completed` once Director signals satisfactory drill outputs (or signals close-without-drill).

---

## Cross-references

- **Mission entity:** `get_mission(mission-48)` (Hub) — `M-Local-FS-Cutover`.
- **Design round:** thread-303 — engineer audit surfaced Flag #1 (Audit/Notification regression — split into prerequisite mission-49) + Flag #1b (NODE_ENV gate hard-refusal — relaxed in T1) + Flag #2 (Docker bind-mount uid/gid — addressed in T1 + this drill in §2).
- **PR coordination:** thread-306 (rounds 1-10) + thread-307 (round-limit successor; mission-48 close coordination here).
- **ADR amendment:** `docs/decisions/024-sovereign-storage-provider.md` §6.1 — local-fs reclassification dev-only → single-writer-laptop-prod-eligible.
- **Trace:** `docs/traces/m-local-fs-cutover-work-trace.md`.
- **Code prerequisites:** PR #24 (T1) + PR #25 (T2a) + PR #26 (T2b) + PR #27 (T2c) all merged on `main`.
- **Bug carry-forward:** bug-32 (cross-package CI debt) — affects every PR; not blocking; documented per architect at PR #21 triage.
- **Side observation:** "Hub redeploy is not gated on mission-merge events" — captured by architect for retrospective + future-mission idea filing post-close (CD-pipeline territory; distinct from idea-191/idea-192).
