# M-Adapter-Streamline — Design v0.1 (architect-draft; round-1 audit pending)

**Status:** v0.1 — architect-authored; engineer round-1 audit pending; Director-ratified Survey envelope at `docs/surveys/m-adapter-streamline-survey.md`
**Mission name:** M-Adapter-Streamline (final naming ratified at Manifest)
**Mission class:** structural-inflection (M sizing; ~2-3 engineer-days; thin bundle + split scope)
**Source Idea:** idea-217 (Streamline adapter compile/update/re-install for consumers)
**Companion Idea:** idea-221 (Pass 10 cross-§ orchestration; operator-side; out-of-scope this mission per Q5 C split-scope)
**Survey:** `docs/surveys/m-adapter-streamline-survey.md` (v1.0; ratified 2026-04-28 ~07:00Z)
**Authors:** lily / architect (v0.1); engineer round-1 audit pending; bilateral round-2 ratify expected
**Lifecycle phase:** 4 Design (architect+engineer-led; Director-out per autonomous-arc-driving)

---

## §1 Goal + intent (echo Survey envelope)

**Goal:** ship a **consumer-receipt-friendly streamline** for adapter compile/update/re-install across local-dev + external + future-agent-pool audiences (NOT operator-runbook surface), driven by 3 orthogonal pressures (consumer friction reduction + Pass 10 §B/§D mechanisation + adapter distribution channel) — delivered as a single big-bang structural-inflection-class mission.

**Architectural framing (sketch):** *"Adapter update is a consumer-self-serve operation."* The substrate provides ONE consumer-installable package family + ONE local update script that frontends the package; the consumer never has to know about SDK source structure, tgz packaging, plugin cache, or restart sequencing. Pass 10 §B + §D step-skip-class regression (calibration #25) is closed by mechanisation embedded in the package.

**Tele primaries (Survey-confirmed):**
- tele-2 Frictionless Agentic Collaboration (primary)
- tele-7 Resilient Operations (primary)
- tele-3 Absolute State Fidelity (secondary, elevated by namespace-coherence concern from Q6 NOT-A)
- tele-6 Deterministic Invincibility (secondary)

**Anti-goals (locked at Survey Q6 B+C+D):**
- NO Universal Adapter / ACP redesign integration
- NO idea-102 Universal Port absorption
- NO Hub-served adapter shape (option 5 from idea-217 ruled out)

**Q6 NOT-A (Design-brainstorm anchor):** namespace decision (`@ois/*` vs `@apnex/*` vs hybrid) stays in-scope for Design v0.1 resolution per Survey §3 Q6 interpretation.

---

## §2 Architecture

### §2.1 Output shape (the minimum-viable bundle)

Two artifacts ship in this mission:

#### A. npm-published adapter package family (option 3 from idea-217)

A family of npm packages encapsulating SDK source + pre-built dist + plugin shim binaries:

- **`<namespace>/network-adapter`** — the SDK (handshake parsing, prompt-format, tool-manager, kernel)
- **`<namespace>/cognitive-layer`** — the cognitive pipeline (telemetry, circuit-breaker, write-call-dedup, tool-result-cache)
- **`<namespace>/message-router`** — message-routing primitives
- **`<namespace>/claude-plugin`** — claude-plugin shim packaging (consumes the SDKs as deps; ships shim binaries + `install.sh`)
- **(future)** `<namespace>/opencode-plugin` — opencode-plugin variant; **stub-only this mission per anti-goal** (see §4)

`<namespace>` is the Q6 NOT-A namespace decision (resolved §2.3 below).

**Publishing target:** npm public registry (or private if Director prefers; ratify at Manifest).

**Consumer install flow:**
```bash
npm install -g <namespace>/claude-plugin@latest
# OR via local script (option B below)
```

**Pass 10 §B + §D mechanisation embedded:**
- Postinstall hook runs the install.sh equivalent automatically
- `dist/` ships pre-built (no tsc run on consumer side)
- tgz repack + cross-package SDK linkage handled at publish time, not consumer time
- Single source of truth = the published package version (no `file:../sibling` deps; resolves Layer-3 lesson from mission-61)

#### B. Local update script — `scripts/local/update-adapter.sh` (option 1 from idea-217)

Single-command ergonomic frontend for local-dev consumers. Delegates to npm:

```bash
#!/bin/bash
# scripts/local/update-adapter.sh
# Single-command adapter update for local-dev consumers
# Frontend to npm-published <namespace>/claude-plugin@latest

set -euo pipefail

# 1. Update local checkout (informational; not required for npm flow)
echo "Pulling latest main..."
git pull origin main

# 2. Install latest published adapter package
echo "Installing latest <namespace>/claude-plugin..."
npm install -g <namespace>/claude-plugin@latest

# 3. Inform consumer of restart requirement
echo ""
echo "✓ Adapter updated to latest."
echo "  Restart your Claude session to pick up the new shim."
```

**Behaviors:**
- Single command: `./scripts/local/update-adapter.sh`
- Delegates ALL rebuild logic to the npm package (the script is a thin wrapper)
- Emits clear "restart required" notice
- Exit code conveys success/failure for CI integration

**Why script frontends npm (not standalone):**
- Single source of truth for rebuild logic = npm package internals
- Script is purely ergonomic wrapper for local-dev who prefer `./script.sh` to `npm install -g ...`
- External consumers + future-pool members can use npm directly without the script
- No code duplication; script is ~10 lines

### §2.2 Pass 10 §B + §D mechanisation (embedded in package)

Per Survey Q5 C narrow scope, this mission mechanises Pass 10 §B + §D ONLY (consumer-side rebuild + reinstall). §A (Hub rebuild) + §C (state-migration) stay manual operator-side; idea-221 captures the cross-§ orchestration scope as separate future mission.

**§B (SDK rebuild + tgz repack + reinstall) mechanisation:**
- npm package publish-time: build dist; pack tgz; resolve cross-package deps; bundle into single publishable artifact
- npm package install-time: `dist/` already built; cross-package deps already resolved; consumer skips entire §B step locally

**§D (claude-plugin reinstall) mechanisation:**
- npm package postinstall hook runs the equivalent of `./install.sh` (shim install + claude plugin registration)
- Consumer skips manual `cd adapters/claude-plugin && rm -rf node_modules && ./install.sh` sequence

**Out of scope (per Q5 C):**
- §A Hub container rebuild — operator-side; remains manual `scripts/local/build-hub.sh` (deferred to idea-221)
- §C state-migration script — operator-side; per-PR migration scripts remain operator-runs (deferred to idea-221)
- Cross-§ orchestration runner (auto-detect + sequence §A→§B→§C→§D) — deferred to idea-221

### §2.3 Namespace decision (Q6 NOT-A; Design v0.1 resolution)

Three candidate namespaces:

| Option | Trade-off |
|---|---|
| **α. Keep `@ois/*`** | Current internal namespace; no migration cost; less marketing-recognizable; signals "internal package" to external consumers (which is no longer accurate) |
| **β. Move to `@apnex/*`** | Director-prior-preference signal per `project_npm_namespace_apnex.md`; recognizable; namespace migration cost is small one-time (~10 places: package.json files, install.sh scripts, file:tgz refs, doc references) |
| **γ. Hybrid: publish `@apnex/*` + keep `@ois/*` as deprecated alias** | Transition-friendly; doubles maintenance surface; conflicts with anti-goal §8.1 mission-63 "clean cutover" precedent |

**Architect-lean: β (move to `@apnex/*`).** Reasoning:
1. Director's prior preference signal (`project_npm_namespace_apnex.md`)
2. Namespace migration is small one-time cost amortized over future external-consumer surface
3. Recognizable namespace = lower friction for external consumers (tele-2)
4. Aligns with mission-63 clean-cutover precedent (γ hybrid would re-introduce the co-existence overhead mission-63 explicitly retired)
5. Matches the consumer-receipt-fidelity framing — `@apnex/*` IS what the substrate is

**Open question for round-1 audit:** does engineer have any operational concerns with α→β migration sequence (e.g., npm registry account ownership, in-flight `@ois/*` consumer breakage, CI/CD reference-pinning)?

---

## §3 Wave plan

| Wave | Scope | PR | Sizing |
|---|---|---|---|
| **W0** | Survey + Design v1.0 + ADR scaffold (ADR-029 candidate; see §6) + Preflight artifact bundle PR | 1 PR; doc-only | ~30min architect-time |
| **W1+W2 atomic** | npm package family setup (publish flow + cross-package deps) + local update script + namespace migration α→β + Pass 10 §B+§D mechanisation embedded + tests | 1 PR; substrate-introduction | ~1-1.5 engineer-days |
| **W3 DOGFOOD GATE** | Substrate-self-dogfood verification — use new script + npm package to update adapter mid-mission (vs manual Pass 10 recipe) | 1 architect-bilateral thread; observation-only OR substrate-changing per round-1 audit | ~30min architect-time |
| **W4** | Closing audit + Pass 10 protocol-extension PR (update §B+§D references in `multi-agent-pr-workflow.md` to point at npm package + script as canonical mechanism) + ADR final | 1 PR; doc-only | ~30min architect-time |

**Aggregate sizing:** ~2-3 engineer-days (M class). Smaller than mission-63 (L) due to thin bundle + split scope.

**Wave-coherence operational sequence (ratified at Manifest, not Design):**
- W0 Survey + Design ratification on thread (architect↔engineer; bilateral close)
- W0 Manifest + Preflight + Release-gate (Director ratifies)
- W1+W2 atomic ship (engineer claim; tight-cycle merge)
- W3 dogfood gate (architect uses new script to update adapter; verifies substrate works)
- W4 closing audit ships

**Per-PR coherence requirement:** No partial-state on main during execution — namespace migration α→β must be coupled with package publish flow + script wiring in the same PR.

---

## §4 Anti-goals (locked at Survey Q6)

### §4.1 Locked anti-goals (Q6 B + C + D)

1. **NO Universal Adapter / ACP redesign integration** (per idea-217 NOT-scope; orthogonal future-mission territory; per `project_director_chat_acp_redesign.md`)
2. **NO idea-102 Universal Port absorption** (per idea-217 NOT-scope; orthogonal contract layer; complementary not subsuming)
3. **NO Hub-served adapter shape** (option 5 from idea-217 ruled out by Survey Q1 D rejection; Hub-as-source pattern out of scope)

### §4.2 Architect-derived implicit anti-goals (Round 1 + Round 2 cross-coherence)

4. **NO §A Hub rebuild + §C state-migration mechanisation** (per Survey Q5 C split-scope; operator-side scope deferred to idea-221)
5. **NO opencode-plugin full parity** (stub-only this mission; mirrors mission-62/63 vertex-cloudrun stub-only precedent for engineer-side adapter)
6. **NO CLI middleware** (per Survey Q4 A thin bundle; CLI-as-frontend-to-npm rejected; script suffices)

### §4.3 Q6 NOT-A clarification

**`@ois/*` → `@apnex/*` namespace migration is IN-SCOPE this mission** per Survey Q6 NOT-A (Director intentionally did NOT lock this as anti-goal). Architect-lean: option β (move to `@apnex/*`) per §2.3.

---

## §5 Risks + open questions

### §5.1 Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | npm publish account / registry ownership unresolved | Medium | Architect to surface at round-1 audit; Director may need to ratify npm account ownership at Manifest |
| R2 | Cross-package dep resolution at publish time may surface mission-61 Layer-3 class issues | Medium | Engineer round-1 audit should validate publish flow handles `file:../sibling` resolution correctly; may need to flatten cross-package structure or use workspace publish |
| R3 | Postinstall hook security concerns (consumers may have postinstall disabled by policy) | Low-Medium | Document graceful degradation: if postinstall blocked, local script can still drive install manually |
| R4 | Namespace migration α→β coupling with package publish — partial state on main if migration touches refs but publish flow not yet live | Medium | Coupled in single PR (W1+W2 atomic); pre-merge dry-run validates end-to-end (per mission-63 §9.1 ratified operational sequence) |
| R5 | Calibration #25 root-cause class re-emergence if consumer skips the script + does manual recipe wrong | Low | Solution: deprecate the manual recipe in `multi-agent-pr-workflow.md` Pass 10 §B + §D; canonical mechanism becomes the npm package + script (W4 closing wave deliverable) |

### §5.2 Open questions for engineer round-1 audit

1. **Namespace decision (Q6 NOT-A):** does engineer concur with architect-lean β (`@apnex/*` clean cutover)? Operational concerns?
2. **Publish flow:** workspace publish (per `idea-186` npm workspaces) or per-package publish? Does engineer have a preferred mechanism?
3. **Postinstall hook:** can claude-plugin's `install.sh` run cleanly as a postinstall hook, or does it need refactoring for npm-publish context?
4. **Cross-package deps:** how does the publish flow resolve `file:../network-adapter/ois-network-adapter-2.0.0.tgz`-style refs in `package.json`? Mission-61 Layer-3 lesson — these don't survive `npm pack`. Does the publish flow flatten to `<namespace>/network-adapter` deps, or use workspaces, or some other mechanism?
5. **Substrate-self-dogfood (W3):** is W3 dogfood-gate observation-only (use new mechanism, observe; don't change substrate) OR substrate-changing (use new mechanism to ship a substrate change mid-mission)? Architect lean: observation-only first; defer substrate-changing dogfood to a follow-on real-mission usage.
6. **opencode-plugin scope:** stub-only this mission per anti-goal §4.2 #5 — does engineer concur, or is opencode-plugin parity small enough to bundle?
7. **Pass 10 protocol-extension PR (W4):** what's the right level of deprecation language for §B + §D manual recipe? "Deprecated; use npm package + script" OR "Removed; npm package + script is canonical"?
8. **Future idea-221 dependency:** does engineer foresee any architectural couplings between this mission and idea-221 that need pre-anchoring?

---

## §6 Mission-class declaration + ADR scaffold

### §6.1 Mission-class

**structural-inflection** (introduces consumer-receipt mechanism that future adapter-update flows ride). M sizing (~2-3 engineer-days). Smaller than mission-63 due to thin bundle + split scope.

### §6.2 ADR candidate

**ADR-029 (candidate; ratify at Manifest):** *"Adapter update is consumer-self-serve via npm-published packages + local script wrapper."* Captures the architectural commitment of:
- npm-publish IS the canonical adapter distribution channel (not git checkout + manual rebuild)
- Pass 10 §B + §D mechanisation embedded in published packages (not in operator scripts)
- Local script is ergonomic frontend (not source-of-truth for rebuild logic)
- Namespace decision: `@apnex/*` (architect-lean β; ratify at Design v1.0)

**Sealed companions:**
- Pass 10 protocol (just landed mission-63 W5 PR #120; this ADR extends §B + §D to point at npm package as canonical mechanism)
- ADR-028 (canonical envelope; orthogonal — wire-shape contract; this ADR is about distribution/install contract)
- mission-61 Layer-3 lesson (sealed companion; this ADR closes the Layer-3 root-cause class structurally)

### §6.3 Substrate-self-dogfood discipline

Per `feedback_substrate_self_dogfood_discipline.md`, this mission's substrate IS the adapter-update mechanism. W3 dogfood-gate proposed: use the new script + npm package to update the adapter mid-mission, validate substrate works on real adapter-update path.

**Architect-lean: observation-only dogfood (mission-62 W4 precedent).** Use the new mechanism on a non-mission-affecting adapter version bump; observe handshake parses cleanly post-update; verify no regression. Defer substrate-changing dogfood (use new mechanism to ship a real substrate change) to first follow-on real-mission usage.

Round-1 audit ratification expected.

---

## §7 Engineer audit ask (round-1 questions)

Engineer round-1 audit should surface:

1. Concurrence (or alternative) on namespace decision Q6 NOT-A → β (per §5.2 #1)
2. Operational concerns on publish flow (per §5.2 #2-4)
3. Substrate-self-dogfood scope (per §5.2 #5)
4. opencode-plugin parity scope (per §5.2 #6)
5. Pass 10 deprecation language (per §5.2 #7)
6. idea-221 dependency couplings (per §5.2 #8)
7. Any architectural surfaces missing from §2 (the audit's "what did architect miss?" check)
8. Sizing recalibration (M still feels right? or larger/smaller?)

Engineer round-1 audit thread to open after Design v0.1 ships. Bilateral round-2 ratify expected on the Survey-thread or new Design-thread (mission-63 thread-399 precedent).

---

## §8 Cross-references

- **Source Idea:** idea-217 (Streamline adapter compile/update/re-install for consumers)
- **Companion Idea:** idea-221 (Pass 10 cross-§ orchestration; operator-side; out-of-scope this mission)
- **Survey:** `docs/surveys/m-adapter-streamline-survey.md` v1.0
- **Methodology:**
  - `docs/methodology/idea-survey.md` v1.0
  - `docs/methodology/multi-agent-pr-workflow.md` (Pass 10 protocol; ships at mission-63 W5 PR #120)
  - `docs/methodology/mission-lifecycle.md`
  - `docs/methodology/mission-preflight.md`
- **Architectural-precedents:**
  - mission-63 (M-Wire-Entity-Convergence; clean-cutover discipline; tight-cycle merge cadence; structural-inflection M-class precedent)
  - mission-62 (M-Agent-Entity-Revisit; Pass 10 §A discipline + state-migration discipline; substrate-introduction L-class)
  - mission-61 (M-Pulse-Primitive-Surface-Closure; Layer-1+2+3 SDK-tgz-stale lesson source)
  - mission-57 (M-Mission-Pulse-Primitive; coordination-primitive-shipment class precedent)
- **ADRs (sealed companions):**
  - ADR-029 (candidate; this mission's ADR; ratify at Manifest)
  - ADR-028 (canonical envelope; orthogonal — wire-shape vs distribution-shape)
- **Memory referenced:**
  - `project_npm_namespace_apnex.md` (Director-prior-preference signal; activates §2.3 architect-lean β)
  - `feedback_substrate_self_dogfood_discipline.md` (W3 dogfood-gate framing)
  - `feedback_complete_mission_scope_methodically.md` (split-scope discipline per Q5 C)
  - `feedback_thread_vs_github_approval_decoupled.md` (calibration #24 dual-surface; W0/W1+W2/W4 PR review precedent)

---

## §9 Status

- **v0.1 ARCHITECT-DRAFT** (this commit; round-1 audit pending)
- v0.2 expected: post round-1 audit (engineer-surfaced asks incorporated)
- v1.0 expected: bilateral round-2 ratify (architect+engineer concur; ships in W0 bundle PR with Survey + Preflight)

---

*Design v0.1 architect-draft 2026-04-28 ~07:00Z+. Round-1 audit pending (engineer); bilateral round-2 ratify expected; Manifest+Preflight+Release-gate cycle follows. Architect: lily.*
