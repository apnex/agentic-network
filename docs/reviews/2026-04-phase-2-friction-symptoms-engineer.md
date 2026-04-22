# Phase 2 Friction Symptoms — Engineer Collection (Pass 2.A: Bugs)

**Status:** Pass 2.A — incremental commit covering Pass A (bug walk, 28 symptoms). Pass B (thread content scan) and Pass C (work-trace harvest) trailing in subsequent commits per agreed parallel cadence (thread-251).

**Author:** greg (engineer, eng-0d2c690e7dd5), 2026-04-22 AEST.
**Architect consumer:** lily (eng-40903c59d19f), classification + ranking pass.
**Output destination:** input to lily-drafted `docs/reviews/2026-04-phase-2-friction.md` (the Phase 2 ratifiable artifact).

**Schema** (per architect thread-251 round 2; load-bearing fields ★):

| Field | Type | Notes |
|---|---|---|
| symptom_id | str | stable key, format `sym-<pass>-<NNN>` (e.g. `sym-A-001`) |
| source | str | citation: bug-NN / thread-NNN / trace:file:section / commit SHA |
| narrative | str | 1–3 sentences describing observed friction |
| domain_candidate | str | first-pass attribution from plan's 8 starting domains OR `new-domain-needed` flag |
| tele_violations | list[tele-N] | which teles this violates (heuristic from class+tags; lily refines) |
| frequency | enum | once / rare / rare-historical / recurring / frequent / continuous |
| cost | enum | trivial / minor / moderate / blocking / cascade-blocker |
| linked_ideas ★ | list[idea-NN] | existing backlog ideas addressing this symptom (empty = unaddressed gap) |
| fix_status ★ | enum | no-idea-filed / idea-filed / idea-triaged / mission-proposed / mission-active / shipped / shipped-but-leaks |

**Authoritative data:** `docs/reviews/2026-04-phase-2-data/bugs-symptoms.tsv` (29 rows including header).

---

## 1. Pass 2.A summary stats (bugs only)

**Total symptoms collected:** 28 (one per bug entity).

**Domain distribution (engineer first-pass):**

| Domain candidate | Count | Symptom IDs |
|---|---|---|
| cognitive-layer | 7 | sym-A-003, A-010, A-011, A-013, A-019 (others in cluster) |
| cascade-execution | 7 | sym-A-001, A-002, A-007, A-008, A-014, A-022, A-027 |
| identity-layer | 4 | sym-A-005, A-016, A-017, A-018, A-026 |
| tool-surface | 4 | sym-A-004, A-006, A-012, A-021, A-023 |
| entity-vocabulary | 2 | sym-A-024 (no retirement primitive for teles), A-013 (list_tasks sort) |
| delivery | 2 | sym-A-010 (architect-liveness ancestor of bug-25), A-025 (thread truncation) |
| coordination | 2 | sym-A-020 (workflow advancement), A-023 (bilateral-seal race) |

**Fix-status distribution:**

| fix_status | Count |
|---|---|
| shipped | 14 (resolved bugs with fixCommits) |
| no-idea-filed | 10 (open bugs without backlog idea linking) |
| idea-triaged | 4 (open bugs with linked idea status=triaged) |
| shipped-but-leaks | 0 by automated heuristic (see §3 — bug-10 is the canonical example; flagged manually below) |

**Tele-violation distribution** (heuristic from bug class + tags):

| Tele | Count of bug-symptoms violating |
|---|---|
| tele-7 (Resilient Operations) | ~12 |
| tele-2 (Isomorphic Specification) | ~10 |
| tele-3 (Sovereign Composition) | ~8 |
| tele-1 (Sovereign State Transparency) | ~6 |
| tele-11 (Cognitive Minimalism) | ~3 (cognitive-class bugs) |
| tele-4 (Zero-Loss Knowledge) | ~2 (delivery bugs) |
| tele-5 (Perceptual Parity) | ~1 (observability gap) |

---

## 2. Per-domain breakdown — call-outs for lily

### 2.1 cognitive-layer (7 symptoms)

Dominant cluster surfacing from M-Ideas-Audit + M-Cognitive-Hypervisor missions. Includes:
- **sym-A-011 (bug-11)** — *cognitive-layer silence remains live*; CRITICAL severity; fix-status `idea-triaged` (idea-132 captures mitigations); **canonical scope-conflation example with bug-10** (see §3.1)
- **sym-A-003 (bug-3)** — Architect Amnesia / Context Desynchronization; OPEN minor, no-idea-filed
- **sym-A-013 (bug-13)** — list_tasks sort lexicographic — really a tool-surface contract bug; **flagged for lily reclassification** (my domain attribution may be wrong)

### 2.2 cascade-execution (7 symptoms)

Includes both shipped (bug-1, bug-7, bug-8, bug-14) and open (bug-2, bug-22, bug-27, bug-28). Most directly traces to the M-Cascade-Perfection mission scope. The most active class:
- **sym-A-027 (bug-27)** — propose_mission cascade silently drops payload.documentRef — drift bug, recently observed (2026-04-22)
- **sym-A-028 (bug-28)** — DAG dep-evaluation against already-completed task → blocked — 2026-04-22 observed
- **sym-A-002 (bug-2)** — DAG retroactive unblocking race — pre-existing, no idea filed yet (likely covered by mission-9 scope but not explicitly linked)

### 2.3 identity-layer (4 symptoms)

All RESOLVED via mission-40 + mission-18/19 + bug-16. Cluster represents the closed identity-hardening arc. Historical-friction class; no current open identity-layer bugs at severity ≥ major.

### 2.4 tool-surface (4 symptoms)

Includes:
- **sym-A-004 (bug-4)** — OpenCode Plugin syncTools hashes names not schemas (manually corrected from `uncategorized` — heuristic missed the schema-cache pattern; flagging as observation)
- **sym-A-006 (bug-6)** — get_task can't retrieve historical tasks
- **sym-A-012 (bug-12)** — threads-2-smoke.test.ts loopback helper missing ADR-017 stores
- **sym-A-021 (bug-21)** — task-313 chunkReplyMessage UTF-16 splitting

### 2.5 entity-vocabulary (2 symptoms)

- **sym-A-024 (bug-24)** — *no retirement primitive for teles* — MAJOR, no-idea-filed; surfaced during Phase 1 tele rewrite; blocks formal retirement of 5 superseded pre-rewrite teles
- (sym-A-013 listed in cognitive-layer above; could double-count to entity-vocabulary if id-numbering is considered an entity-vocabulary concern — lily's call)

### 2.6 delivery (2 symptoms)

- **sym-A-010 (bug-10)** — architect-liveness class — ancestor of the delivery class; SHIPPED via ADR-017 — sym-A-011 (bug-11) is its scope-conflation leak
- **sym-A-025 (bug-25)** — thread message delivery truncation at ~10–15KB; MAJOR, no-idea-filed (workaround documented; idea-152 Smart NIC would absorb structurally)

### 2.7 coordination (2 symptoms)

- **sym-A-020 (bug-20)** — *workflow engine review→next-task advancement* — RESOLVED via task-316; superseded by idea-144 as implementation vehicle
- **sym-A-023 (bug-23)** — Thread bilateral-seal race when architect cascade-converges first — INVESTIGATING; minor; observed twice on thread-241

---

## 3. shipped-but-leaks call-outs (per architect §10.x sub-classes)

### 3.1 Sub-class (a): scope-conflation — `sym-A-010 (bug-10) → sym-A-011 (bug-11)`

bug-10 ("Architect non-response to thread SSE — class bug (P0)") was declared RESOLVED via ADR-017 (transport-layer fix: persist-first queue + watchdog escalation). bug-11 ("Architect LLM tool-round exhaustion — cognitive-layer silence class remains live") was filed explicitly noting "bug-10's fix was transport-only". Same observable symptom (architect silence on threads), distinct mechanism (transport drop vs cognitive exhaustion), separate fixes.

**Recommended fix-status update:** sym-A-010 → `shipped-but-leaks` (subclass: scope-conflation, leak-tracker: bug-11). Currently flagged as `shipped` in the TSV; lily can reclassify per her judgment.

### 3.2 Sub-class (b): back-compat runway — mission-40 auto-claim hooks

Not a direct bug entity, but worth flagging at the symptom level: mission-40 shipped the identity/session-claim separation with two intentional back-compat auto-claim hooks (SSE-subscribe + first-tools/call) per brief §10.1. These are deliberate runway leaks, gated on deprecation-runway dashboard zero-trend. Will surface as a symptom in Pass B (thread scan of mission-40 closing audit + dashboard spec) rather than Pass A.

---

## 4. Engineer-flagged judgment calls for lily review

1. **sym-A-013 (bug-13)** — list_tasks sort: I attributed `cognitive-layer` because the bug surfaced during architect cognitive-layer measurement. But the actual scope is `tool-surface` (sort contract). Reclassify if you agree.
2. **sym-A-004 (bug-4)** — Heuristic missed (defaulted to `uncategorized`); manually corrected to `tool-surface`. Suggests my class→domain mapping needs a "schema-cache" → tool-surface rule. Flag for retro.
3. **shipped-but-leaks subclass schema** — I did NOT add a sub-class subfield to the TSV. Per your "flat is fine, I'll distinguish during classification" — kept simple. Sub-class call-outs in §3 above are for your manual lookup.
4. **Frequency heuristic** — currently severity-based (critical/major → recurring; minor → rare; resolved → rare-historical). Crude. Could be improved by counting `shipped-but-leaks` re-surface incidents in Pass B (threads). Defer.
5. **Domain count "8 starting domains" vs my 7** — I haven't surfaced a `role-scoping`, `deployment`, or `debugging-loop` symptom from bugs alone. All three may surface in Pass B/C. Note that I have `identity-layer` + `cascade-execution` + `cognitive-layer` which the plan's starting set lacked — these were the Phase 1 cartography emergent clusters and look domain-worthy here. **Suggest you formalize them as additional domains.**

---

## 5. Coverage check (Pass A only)

- ✓ Every bug (28) mapped to a symptom (sym-A-001 through sym-A-028)
- ✓ Every symptom has domain_candidate (no `new-domain-needed` flagged in Pass A; may surface in B/C)
- ✓ linked_ideas populated for every symptom (best-effort grep across 158 ideas; uncertain matches not flagged with `?` since automated grep had no ambiguity for these)
- ✓ fix_status mapped per logic stated in thread-251 round 3

**Pass B/C will add:** thread-friction symptoms (engineer / architect / Director frustration patterns), work-trace reflections (governance + workflow friction sections per tele-10 success criterion). Expect 20–50 additional symptoms.

---

## 6. Companion data location

Authoritative TSV: `docs/reviews/2026-04-phase-2-data/bugs-symptoms.tsv` (regenerable via the python script noted in §A1 below).

Pass B output will land at `docs/reviews/2026-04-phase-2-data/threads-symptoms.tsv`.
Pass C output will land at `docs/reviews/2026-04-phase-2-data/traces-symptoms.tsv`.
Combined view (unified ID space across A+B+C) will be assembled in a final Pass 2.D commit.

---

## A1. Reproduction (Pass A)

```python
# Run from /tmp/cartography-pass1 with bugs/ + ideas/ pulled from gs://ois-relay-hub-state/
import json, os, re

ideas_by_id = {json.load(open(f"ideas/{f}"))["id"]: json.load(open(f"ideas/{f}"))
               for f in os.listdir("ideas")}

def find_linked_ideas(bug_id):
    out = set()
    for iid, idea in ideas_by_id.items():
        joined = "|".join(idea.get("tags", [])).lower()
        bid = bug_id.lower()
        if any(p in joined for p in [
            f"migrated-to-bug-{bug_id.split('-')[1]}",
            f"migrated-to-bug:{bid}",
            f"linked:{bid}", f"superseded-by:{bid}",
            f"superseded-by-bug:{bid}", f"resolved-by-bug:{bid}",
            f"{bid}-scope-conflation", f"{bid}-followup",
        ]):
            out.add(iid)
    return sorted(out)

# domain + fix_status + tele_violations heuristics: see §2.4 in source script
# at /tmp/cartography-pass1/phase2/build-bugs-symptoms.py (engineer scratchpad)
```

---

*End of Pass 2.A. Pass B (thread content scan) follows; Pass C (work-traces) third. Architect classification of Pass A can begin immediately per agreed parallel cadence.*
