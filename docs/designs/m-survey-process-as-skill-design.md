# M-Survey-Process-as-Skill — Design v0.1

**Status:** v0.1 DRAFT (architect-authored 2026-05-01; pending engineer round-1 audit + bilateral converge to v1.0)
**Methodology:** Phase 4 Design per `mission-lifecycle.md` v1.2 §1 (RACI: C=Director / R=Architect+Engineer)
**Survey envelope:** `docs/surveys/m-survey-process-as-skill-survey.md` (Director-ratified 6 picks; commit `ce5b6c1`)
**Source idea:** idea-228 M-Survey-Process-as-Skill (status `triaged` via route-(a) skip-direct)
**Companion umbrella:** idea-229 (Sovereign-Skill Pattern + Mission-Lifecycle-as-Skills Vision)
**Companion downstream:** idea-230 (claude-plugin install bootstrap; pending mission)
**Branch:** `agent-lily/idea-228` (Survey pushed; this Design lands on same branch per mission-68 M6 fold pattern)

---

## §0 Document orientation

Design v0.1 concretizes Survey envelope (6 Director picks) into operational decisions for Phase 8 Execution. Reading order:
- §1 Mission scope summary (Survey envelope reference)
- §2 Skill body anatomy — `/skills/survey/` directory layout + file roles
- §3 SKILL.md structure (frontmatter + sections)
- §4 Helper script signatures + invocation pattern (Q4=d batched gates)
- §5 Tier-status matrix shape (Q5=c declarative)
- §6 Survey envelope artifact format (Q6=d YAML frontmatter)
- §7 Tier-2/3 stub interface convention (exit-code 42 sentinel)
- §8 Hub integration + error handling (retry-once-fall-through)
- §9 Mission-class default heuristic
- §10 Test / verification strategy
- §11 PR sequencing + content map
- §12 Anti-goals + Phase-N revisit-axes
- §13 Round-1 audit open questions (engineer-side; architect-flags)
- §14 Cross-references

---

## §1 Mission scope summary

Per Survey envelope §3 composite intent envelope:

| Axis | Bound |
|---|---|
| Mission scope | Sovereign Survey Skill at `/skills/survey/`; full feature scope (Q1=d); Tier 1 implemented + Tier 2/3 stubbed (Q2=d); implicit pattern via structure (Q3=a); batched-gate invocation (Q4=d); declarative status matrix (Q5=c); YAML frontmatter artifact (Q6=d) |
| Mission class | substrate-introduction (third-canonical; first-canonical sovereign-Skill instance) |
| Primary outcome | Survey methodology mechanization at architect Phase 3 entry; sovereign-Skill design pattern crystallized via implementation (idea-229 umbrella) |
| Tele alignment (primary) | tele-3 Sovereign Composition + tele-2 Isomorphic Specification + tele-11 Cognitive Minimalism + tele-12 Precision Context Engineering |

---

## §2 Skill body anatomy — `/skills/survey/`

```
/skills/survey/                          # sovereign + git-tracked first-class repo entity
├── SKILL.md                             # frontmatter + status matrix + walk-through
├── round-1-template.md                  # round-1 question framing template
├── round-2-template.md                  # round-2 question framing template
├── envelope-template.md                 # Survey envelope artifact template (frontmatter + prose)
└── scripts/
    ├── survey-init.sh                   # init gate: scaffold envelope at canonical location
    ├── validate-envelope.sh             # finalize gate: shape-check vs idea-survey.md v1.0 spec
    ├── check-skip-criteria.sh           # check route-(a) skip-direct criteria for the Idea
    └── format-pick-presentation.sh      # render Round-N questions in standard markdown shape
```

8 files total; ~400-500 lines of bash + markdown across the Skill body.

**Per AG-7 (no non-bash deps):** scripts are pure bash + standard POSIX utilities (sed, awk, grep, jq if needed). No python, no npm packages.

**Discoverability:** `SKILL.md` is the canonical entry point; templates + scripts referenced by name from SKILL.md prose.

---

## §3 SKILL.md structure

### §3.1 Frontmatter (YAML; per F1 architect-flag → recommend YAML)

```yaml
---
name: survey
version: v1.0
methodology-source: docs/methodology/idea-survey.md v1.0
description: Mechanizes Phase 3 Survey methodology (3+3 Director-intent pick-list + envelope assembly) per idea-survey.md v1.0
sovereign-skill-instance: first-canonical (idea-229 umbrella)
disable-model-invocation: true   # user-triggered; not auto-invoked
---
```

`disable-model-invocation: true` per claude-code-guide research: Skill is user-triggered (architect explicitly invokes at Phase 3 entry); not auto-loaded.

### §3.2 Top section — tier-status matrix (Q5=c declarative)

```markdown
## Sovereignty status

| Input dimension | Tier 1 (default; OIS network) | Tier 2 (override) | Tier 3 (manual fallback) |
|---|---|---|---|
| Tele framework | ✅ Hub `list_tele` query | ⏸ stub (exit-42) | ⏸ stub (exit-42) |
| Source idea | ✅ Hub `get_idea(<id>)` | ⏸ stub | ⏸ stub |
| Output location | ✅ `docs/surveys/<mission>-survey.md` | ⏸ stub | ⏸ stub |
| Mission-class taxonomy | ✅ Hub `create_mission` enum + heuristic | ⏸ stub | ⏸ stub |
| Methodology spec | ✅ ref `docs/methodology/idea-survey.md` v1.0 | ⏸ stub | ⏸ stub |
| Director-pick capture | ✅ Conversation (universal) | — | — |

**Sovereignty posture:** Tier-1 implemented + tested. Tier-2 + Tier-3 paths are interface-stubbed (exit code 42 sentinel) per Path C sovereign-design discipline. External-network adoption asks trigger Tier-2/3 implementation work (idea-229 umbrella).
```

### §3.3 Walk-through sections (sequential prose)

5 sections + Skill prose for the architect agent reading the file:

1. **Init gate** — Skill instructs Claude to call `scripts/survey-init.sh <mission-name> <idea-id>`. This script: pulls idea text via Hub `get_idea`; scaffolds envelope at `docs/surveys/<mission>-survey.md` with frontmatter skeleton; reports scaffold path to architect. **Single Bash tool invocation per Q4=d batched.**

2. **Round-1 question design + dispatch** — Skill loads `round-1-template.md` template + idea-context (already pulled by init script); prompts architect to design 3 orthogonal questions per the template; architect synthesizes for Director chat.

3. **Round-1 pick capture + interpretation** — architect reports Director picks (Q1/Q2/Q3 letters + optional rationale) back to the Skill flow; Skill prompts for per-pick interpretation; updates envelope artifact with Round-1 section.

4. **Round-2 question design + dispatch** — Skill loads `round-2-template.md` template; uses Round-1 picks as context for refining Round-2 questions; same dispatch + capture rhythm.

5. **Finalize gate** — Skill instructs Claude to call `scripts/format-pick-presentation.sh && scripts/validate-envelope.sh`. Combined gate: format-pick-presentation finalizes prose; validate-envelope checks shape vs `idea-survey.md` v1.0 spec; both write status to stdout. Architect reviews combined output; if validation FAIL, Skill prompts architect to fix + re-run.

### §3.4 Closing section — pattern-establishment-via-implicit (Q3=a)

No "this is the canonical sovereign-Skill template" anchor block per Q3=a. SKILL.md ends with a brief cross-reference list (idea-228 + idea-229 + idea-230 + `docs/methodology/idea-survey.md`).

**Pattern-discoverability:** future Skill authors reading this SKILL.md infer the sovereign-Skill structure from: frontmatter shape + status matrix + helper-script invocation pattern + envelope frontmatter + tier-stubbing convention. No prose preaches the pattern.

---

## §4 Helper script signatures + invocation pattern (Q4=d batched gates)

### §4.1 Convention

Every helper script:
- Bash 4+ shebang (`#!/usr/bin/env bash`)
- `set -euo pipefail`
- Args parsed via positional or `--key=value` form (consistent across scripts)
- stdout for human-readable progress (architect reads); stderr for errors
- Exit codes: `0` success / `42` stub-not-implemented (Tier-2/3 sentinel) / non-zero other for actual failures

### §4.2 Script signatures

```bash
# scripts/survey-init.sh — init gate
#   Usage: survey-init.sh --mission-name=M-<name> --idea-id=idea-<N>
#   Effects: pulls idea via Hub get_idea (Tier 1) → scaffolds docs/surveys/<mission>-survey.md
#            with frontmatter skeleton + idea-context section seeded
#   Exit: 0 success / 1 idea not found / 42 stub-not-implemented (if Tier-2/3 dispatch)

# scripts/validate-envelope.sh — finalize gate
#   Usage: validate-envelope.sh --envelope-path=docs/surveys/<mission>-survey.md
#   Effects: parses frontmatter + prose; checks against idea-survey.md v1.0 schema
#            (required sections, frontmatter required keys, picks-completeness, anti-goals present)
#   Exit: 0 valid / 1 schema violation (with diagnostic message) / 42 stub

# scripts/check-skip-criteria.sh — pre-Survey route-(a) check
#   Usage: check-skip-criteria.sh --idea-id=idea-<N>
#   Effects: pulls idea via Hub; walks 5 skip-criteria from strategic-review.md §Idea Triage Protocol
#            reports matrix of criteria-met-or-not with rationale
#   Exit: 0 all-5-met (skip-direct candidate) / 1 some-not-met (triage thread needed) / 42 stub

# scripts/format-pick-presentation.sh — render Round-N questions
#   Usage: format-pick-presentation.sh --round=1|2 --questions-file=<path>
#   Effects: reads question definitions; renders standard markdown shape
#            (Q-N title + brief context + 3-4 picks labeled (a)/(b)/(c)/(d))
#   Exit: 0 success / 1 malformed input / 42 stub
```

### §4.3 Invocation pattern (Q4=d batched gates)

Two structured gates: **init** (one Bash call) and **finalize** (one combined Bash call). Skill prose tells Claude when to invoke each gate; architect reviews combined output per gate.

Question-design + pick-capture phases between gates are conversational (Skill prompts architect; architect reports back). No script invocation during conversational phases.

---

## §5 Tier-status matrix shape (Q5=c declarative)

Markdown table per F4 architect-flag recommendation. Format codified in §3.2 above. Status icons: ✅ (implemented) / ⏸ (stub) / — (N/A; e.g., Director-pick capture is universal). Posture-paragraph below the table summarizes the sovereignty stance.

**Why declarative over implicit:** anyone reading SKILL.md sees the sovereign-shape posture without grepping code. Future Skill authors copy this matrix shape for their own Skills (per Q3=a implicit pattern emergence).

---

## §6 Survey envelope artifact format (Q6=d YAML frontmatter)

### §6.1 Frontmatter shape (codified in `envelope-template.md`)

```yaml
---
mission-name: M-<name>
source-idea: idea-<N>
methodology-source: docs/methodology/idea-survey.md v1.0
director-picks:
  round-1:
    Q1: <letter>
    Q1-rationale: <optional brief>
    Q2: <letter>
    Q2-rationale: <optional>
    Q3: <letter>
    Q3-rationale: <optional>
  round-2:
    Q4: <letter>
    Q4-rationale: <optional>
    Q5: <letter>
    Q5-rationale: <optional>
    Q6: <letter>
    Q6-rationale: <optional>
mission-class: substrate-introduction | spike | structural-inflection | distribution-packaging | ...
tele-alignment:
  primary: [tele-N, tele-M, ...]
  secondary: [tele-X, tele-Y, ...]
anti-goals-count: <N>
architect-flags-count: <N>
skill-meta:
  skill-version: survey-v1.0
  tier-1-status: implemented
  tier-2-status: stubbed
  tier-3-status: stubbed
calibration-cross-refs:
  closures-applied: [#59-3rd-canonical, ...]
  candidates-surfaced: []
---

# M-<name> — Phase 3 Survey envelope

(prose body follows; canonical shape preserved from mission-67 + mission-68 envelopes)
```

### §6.2 Validation rules (encoded in `validate-envelope.sh`)

- Frontmatter required keys: `mission-name`, `source-idea`, `director-picks` (with all 6 picks present), `mission-class`, `tele-alignment`, `skill-meta`
- Prose required sections: §0 Context, §1 Round 1 picks, §2 Round 2 picks, §3 Composite intent envelope, §4 Mission scope summary, §5 Anti-goals, §6 Architect-flags, §7 Sequencing, §8 Cross-references
- Picks: each Q has letter ∈ {a, b, c, d}; optional rationale
- Mission-class: matches one of `create_mission` enum values
- Cross-reference: source-idea reference resolves (Tier 1) — soft warning if not resolvable

---

## §7 Tier-2/3 stub interface convention (exit-code 42 sentinel; F3 architect-flag)

### §7.1 Sentinel rationale

Distinct exit code 42 (otherwise unused) signals "stub not implemented; caller should fall through to next tier" — Skill prose can detect this programmatically:

```bash
if scripts/get-tele-tier-2.sh; rc=$?
elif [[ $rc -eq 42 ]]; then
  scripts/get-tele-tier-3.sh   # fall through to manual prompt
fi
```

### §7.2 Stub function shape (Tier-2 + Tier-3 across all input dimensions)

```bash
#!/usr/bin/env bash
# scripts/get-tele-tier-2.sh — STUB (Tier-2 override path; not implemented)
# Future: read tele framework from <config>/tele.json
# Tracking: idea-228 (this mission), idea-229 (umbrella), exit-42 sentinel discipline

set -euo pipefail
echo "[get-tele-tier-2] STUB: Tier-2 override path not implemented" >&2
echo "[get-tele-tier-2] Falling through to next tier (caller should retry Tier-3)" >&2
exit 42
```

Inline TODO comment + sentinel exit code → both code-side discoverability AND SKILL.md status matrix declarative posture (per Q5=c).

---

## §8 Hub integration + error handling (F5 architect-flag)

### §8.1 Hub MCP tool calls

Skill instructs Claude to invoke MCP tools directly (Skill prose says "use the `list_tele` tool to fetch the current tele framework"). Claude executes the call; results return to Skill flow.

Mapped Hub tools:
- `list_tele` — Tier-1 source for tele framework
- `get_idea` — Tier-1 source for source-idea text + tags + cross-refs
- `list_missions` (filter by status=proposed) — for mission-class default heuristic context (§9)

### §8.2 Error handling pattern (retry-once-fall-through)

Per F5 recommendation:

```
attempt: Tier-1 (Hub MCP tool call)
   ├── success → continue with retrieved data
   ├── transient error (network blip, 5xx) → retry once
   │      ├── retry succeeds → continue
   │      └── retry fails → fall through to Tier-2
   └── hard error (auth, not-found) → fall through to Tier-2

Tier-2 stub returns exit 42 → fall through to Tier-3

Tier-3 stub returns exit 42 → final fallback: prompt architect to provide input manually in chat
```

Defensive default; degrades gracefully; avoids hard-failure on Hub blips. Architect-flagged for engineer round-1 challenge.

---

## §9 Mission-class default heuristic (F6 architect-flag)

Skill suggests a mission-class for the new mission entity creation phase. Heuristic:

1. Scan source-idea text + tags for sovereign-Skill keywords (`/skills/`, `sovereign`, `substrate`, `tier-N`, `SKILL.md`) → suggest **substrate-introduction**
2. Scan for spike-keywords (`spike`, `prototype`, `proof-of-concept`, `time-bounded`) → suggest **spike**
3. Scan for cleanup-keywords (`cleanup`, `consolidation`, `migrate`, `deprecate`) → suggest **substrate-cleanup-wave** OR **pre-substrate-cleanup**
4. Scan for primitive-keywords (`primitive`, `coordination`, `pulse`, `event`, `routing`) → suggest **coordination-primitive-shipment**
5. Default fallback → prompt architect with full `create_mission` enum picks

If multiple matches: present matched candidates to architect; architect picks. If no match: prompt architect with full enum.

---

## §10 Test / verification strategy

### §10.1 Helper script tests

Each `scripts/*.sh` has a sibling `scripts/<name>.test.sh` with bash test cases:
- Happy path (Tier-1 success)
- Tier-1 failure → Tier-2 stub returns 42 → Tier-3 stub returns 42 → expected fallback behavior
- Malformed input → exit 1 with diagnostic
- shellcheck clean

### §10.2 Skill body verification

`shellcheck` clean across all `scripts/*.sh`. SKILL.md frontmatter parses as valid YAML (validated via small bash test using `yq` or `python -c "import yaml; yaml.safe_load(...)"`; if both unavailable, simpler grep-based smoke check).

### §10.3 End-to-end smoke (post-merge)

Architect manually invokes the Skill on a synthetic test-idea (small + bounded scope) + verifies envelope artifact produced is well-formed. Full real-mission verification deferred to next mission's actual Phase 3 Survey use (which becomes the canonical first-real-use of the Skill).

### §10.4 No CI test gate added

Helper-script tests + shellcheck run locally + at developer discretion. Not added as required-status-check on the PR (would add CI surface for marginal value at this scope; methodology cost > methodology benefit at first-canonical-instance scope). Future-mission can promote tests to CI if Skill churn justifies.

---

## §11 PR sequencing + content map

### §11.1 Single PR (per F7 architect-flag recommendation)

```
PR #TBD — mission-69 W1 single ship
- /skills/survey/SKILL.md
- /skills/survey/round-1-template.md
- /skills/survey/round-2-template.md
- /skills/survey/envelope-template.md
- /skills/survey/scripts/survey-init.sh
- /skills/survey/scripts/validate-envelope.sh
- /skills/survey/scripts/check-skip-criteria.sh
- /skills/survey/scripts/format-pick-presentation.sh
- /skills/survey/scripts/get-tele-tier-2.sh + tier-3.sh (+ similar tier stubs per dimension)
- /skills/survey/scripts/<name>.test.sh files (bash test cases)
- docs/surveys/m-survey-process-as-skill-survey.md (already pushed; survives this PR)
- docs/designs/m-survey-process-as-skill-design.md v1.x (post-bilateral; this Design lands here)

Total estimated file count: ~15-20 files across templates + scripts + tests + docs
Branch: agent-lily/idea-228 (cumulative; mission-68 M6 fold pattern)
Cross-approval: bilateral architect-engineer per multi-agent-pr-workflow.md v1.0
```

### §11.2 Approval gate

Per memory `feedback_thread_vs_github_approval_decoupled.md`: thread-side approval ≠ GitHub-side approval. Both required.

### §11.3 No Pass 10 rebuild required

Skill body is `/skills/` content + bash scripts. NOT Hub-source code. **Hub container does not need rebuild.** PR landing means main has the new files; architect's session can immediately use the Skill (after manual symlink `ln -s /skills/survey .claude/skills/survey` per pre-idea-230-automation interim).

---

## §12 Anti-goals + Phase-N revisit-axes

### §12.1 Anti-goals (carried forward from Survey envelope §5)

| AG | Reviewer test | Composes-with target |
|---|---|---|
| AG-1 | No `.claude/skills/survey/` dir or symlink in repo | idea-230 |
| AG-2 | No `docs/methodology/sovereign-skills.md` codification | 2nd-canonical-instance precedent |
| AG-3 | Tier-2/3 functions are stubs only (exit 42); not implemented | On-demand future work |
| AG-4 | Skill never writes to `docs/calibrations.yaml` (read-only cross-ref) | Calibration discipline |
| AG-5 | No mechanization of other phases | Separate sovereign-Skill missions |
| AG-6 | No per-RACI Skill loading enforcement | idea-229 + idea-230 |
| AG-7 | Zero non-bash dependencies (no python, npm, jq-required-only) | Bash-only ratification |
| AG-8 | No bridge/webhook/polling-substrate changes | Orthogonal scope |
| AG-9 | `idea-survey.md` v1.0 unchanged | Methodology evolution discipline |

### §12.2 Phase-N revisit-axes

| Axis | Trigger to revisit |
|---|---|
| Tier-2/3 implementation | First external-network adoption ask OR internal need (test env, mock Hub) |
| Methodology codification (`sovereign-skills.md`) | After 2nd-canonical sovereign-Skill instance ships |
| Per-RACI Skill loading enforcement | When idea-230 ships AND multiple Skills exist |
| Survey methodology version pinning | When `idea-survey.md` v1.x bumps; Skill `methodology-source` frontmatter mismatch warning |
| Frontmatter parsing tooling | If/when downstream tools need to consume Survey artifact metadata |
| CI test gate promotion | If Skill churn justifies (e.g., 3+ change PRs surface CI value) |

---

## §13 Round-1 audit open questions (engineer-side; 7 architect-flags from Survey envelope §6)

Per Survey envelope §6, 7 architect-flags batched for engineer round-1 audit. Restated here with Design-level resolution for engineer to challenge:

| # | Flag | Architect-recommendation in this Design |
|---|---|---|
| F1 | Frontmatter format | YAML codified at §3.1 + §6.1 |
| F2 | Bash tool permission allowlist | Defer to user; Skill works with prompts; allowlist as separate small follow-on if friction surfaces |
| F3 | Tier-2/3 stub interface convention | Exit code 42 sentinel codified at §7 |
| F4 | SKILL.md status matrix shape | Markdown table codified at §3.2 + §5 |
| F5 | Hub error handling | Retry-once-then-fall-through codified at §8.2 |
| F6 | Mission-class default heuristic | Keyword-scan codified at §9; fallback to architect prompt |
| F7 | PR sequencing | Single PR codified at §11.1 |

Engineer-side audit invited to challenge any architect-recommendation. Substrate-citation accuracy (idea-survey.md sections, mission-lifecycle.md sections, Hub MCP tool names) is a load-bearing audit-rubric per mission-67 + mission-68 precedent.

### §13.1 Additional questions for engineer audit (beyond Survey-flagged 7)

- **A1.** Should `scripts/survey-init.sh` use `python -c "import yaml..."` for YAML write OR pure `printf` heredocs OR a dedicated `yq` dep? (Currently AG-7 says no python; recommend printf heredocs for now. Engineer challenge welcome.)
- **A2.** Should the Skill emit observability events (e.g., shim-events.ndjson) at gate boundaries for trace + replay? (Architect-recommend: not in v1.0; orthogonal to Skill core; can compose later via observability mission.)
- **A3.** What's the failure mode if the architect doesn't fully fill in a frontmatter field during conversational interpretation phase? (Architect-recommend: `validate-envelope.sh` fails at finalize gate; Skill prompts architect to fix + re-run finalize. No silent data loss.)

---

## §14 Cross-references

- **`docs/surveys/m-survey-process-as-skill-survey.md`** — Survey envelope (composite intent envelope this Design concretizes; commit `ce5b6c1`)
- **`docs/methodology/idea-survey.md`** v1.0 — Survey methodology spec the Skill mechanizes (NOT modified by this mission per AG-9)
- **`docs/methodology/strategic-review.md`** §Idea Triage Protocol — route-(a) skip-direct logic mechanized by `check-skip-criteria.sh`
- **`docs/methodology/mission-lifecycle.md`** v1.2 — Phase 4 Design RACI; companion-doc this mission references but does NOT modify
- **idea-228** — source idea (status `triaged`; this mission instantiates)
- **idea-229** — umbrella architectural anchor (Sovereign-Skill Pattern + Mission-Lifecycle-as-Skills Vision); this mission is first-canonical instance
- **idea-230** — claude-plugin install bootstrap (consumer-install automation; pending mission depending on this mission shipping)
- **mission-67** — first-canonical doc-substrate substrate-introduction (precedent for compressed-lifecycle + tier-hierarchy methodology + frontmatter discipline)
- **mission-68** — second-canonical code-substrate substrate-introduction (precedent for in-flight cleanup + calibration #59 mechanism applied 2nd-canonically)
- **`/packages/storage-provider/` + `/packages/repo-event-bridge/`** — sovereign-package precedent at code layer; `/skills/` mirrors at mechanism layer

---

— Architect: lily / 2026-05-01 (Design v0.1 DRAFT; opens for engineer round-1 audit + bilateral converge to v1.0)
