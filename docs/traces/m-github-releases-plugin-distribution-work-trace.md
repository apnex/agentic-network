# M-GitHub-Releases-Plugin-Distribution — Work Trace (live state)

**Mission scope.** Light up GitHub Releases as the lightweight no-source-clone distribution channel for `@apnex/claude-plugin`. Tag push (`v*`) → workflow packs claude-plugin via `npm pack` (with sovereign-package tarballs bundled + skills/ co-located + build-info embedded per idea-256) → attaches `.tgz` to GitHub Release. Consumer install: `gh release download + tar xzf + bash install.sh` (3 lines). Director-priority directive 2026-05-07: "we need a way for a consumer to add a claude plugin with no access to source." Compressed lifecycle (Phase 4 Design + Phase 8 Implementation; Phase 5/6/10 skipped per small-substrate-feature-mission discipline).

**Anchor:** idea-257.
**Architect coordination thread:** thread-499 — architect lily + engineer greg, 3 rounds so far (round-1 architect dispatch v0.1; round-2 engineer audit + 4 fold asks; round-3 architect ratifies v1.0 with all 4 folds + lib-extraction prescription).
**Branch:** `agent-greg/m-github-releases-plugin` off `main` tip post-PR-#195.
**How to read + update this file:** `docs/methodology/trace-management.md`.

**Status legend:** ▶ in-flight · ✅ done this session · ○ queued / filed · ⏸ deferred

---

## Resumption pointer (cold-session brief)

If picking up cold:

1. **Read this file**, then `docs/designs/m-github-releases-plugin-distribution-design.md` (Design v1.0; pushed at commit `aca8d89` on `agent-lily/m-github-releases-plugin-design`).
2. **Mission status:** Phase 8 Implementation 100% delivered local; PR opening next.
3. **Engineer-side verified:** `scripts/local/test/test-claude-plugin-tarball-install.sh` passes 12/12 (build-info.json + 3 sovereign tarballs + lib/ + skills/survey/ + detect_context-resolves-correctly).
4. **Substrate-currency observation surfaced mid-stream (worth filing as follow-on):** `packages/{network-adapter,message-router}` form an import cycle (NA imports MR's `MessageRouter`/`SeenIdCache` classes; MR imports NA's `SessionState`/`SessionReconnectReason` types). Cycle requires 4-pass topological build (cog → na-allow-fail → mr → na-clean) baked into `scripts/build/lib/prepack-claude-plugin.sh:Step-0.5`. Working-around the cycle, not fixing it; structural fix belongs in a separate refactor mission.

---

## In-flight

▶ PR open + thread-499 round-4 reply

---

## Done this session

✅ **scripts/build/lib/transient-package-swap.sh** — generic helper extracted from `build-hub.sh:139-180` per Design §1.4 lib-extraction prescription. Public API: `swap_workspace_deps_to_tarballs <package_dir> <pkg_pair_1> [...]` + `tps_cleanup` (trap-handler). Unit-tested via `scripts/build/test/test-transient-package-swap.sh` (3 cases: workspace-`*` rewrite + file-path rewrite + missing-target error path; all PASS).
✅ **scripts/build/lib/prepack-claude-plugin.sh** — claude-plugin orchestration: scoped install with `--ignore-scripts` + topological 4-pass build of cycle-bound sovereigns + skills/ stage + sovereign tarball pack + transient swap + npm pack into `release-artifacts/`.
✅ **scripts/local/build-hub.sh** refactored — inline transient-swap (lines 139-180; 50 lines) replaced with `source` + 1-line helper invocation. Hub-container digest expected byte-equivalent (purely structural; same sed pattern via generalized regex; same per-pkg npm install + npm pack).
✅ **`.github/workflows/release-plugin.yml`** — tag push `v*` + manual `workflow_dispatch`; scoped install `--ignore-scripts`; helper invocation; calibration #62 verification gate (6 invariants — build-info.json + 3 sovereign tarballs + lib/bootstrap-skills.sh + skills/survey/); `gh release create` with operator install snippet.
✅ **`adapters/claude-plugin/package.json`** updated — `prepare: npm run build` (F4 fold); `files:` extended with `lib/`, `skills/`, `apnex-*.tgz` (F1 + F2 folds).
✅ **`adapters/claude-plugin/install.sh`** extended — npm-installed branch runs `npm install --no-audit --no-fund --no-save` from `$PLUGIN_DIR` to resolve bundled `apnex-*.tgz` sovereigns (F2 fold; closes the consumer-side missing-module gap on shim runtime imports).
✅ **`scripts/local/test/test-claude-plugin-tarball-install.sh`** — operator-path simulation; pinned per format-regex discipline (12 invariants; all PASS local).
✅ **`adapters/claude-plugin/QUICKSTART.md`** — replaced legacy "Quick install (from GitHub)" with new "Install (no source clone required)" section (3-line install + build-identity verification step). Outdated `ois-network-adapter-2.0.0.tgz` troubleshooting entry refreshed for `apnex-*.tgz` shape.

---

## Queued / filed

○ **Adapter-sovereign import cycle** — `packages/network-adapter` ↔ `packages/message-router` cycle. Working-around via 4-pass build in prepack helper. Filing as follow-on idea after this mission lands.
○ **AG-5 — workspace-lockfile-OIS-prefix-cleanup** — 5-file legacy `ois-*.tgz` refs in `package-lock.json` (lines 52, 57, 65). Deferred per Design §4 AG-5; release-plugin.yml uses scoped install (F7 fold) to side-step.

---

## Edges (dependency chains)

```
idea-257 (Director directive)
  └─→ Design v0.1 (architect) → Design v1.0 (RATIFIED post round-1 audit)
       └─→ Phase 8 Implementation (this work-trace)
            └─→ PR open + architect cross-approve + admin-merge
                 └─→ Phase 9: cut test tag → workflow → release verify → bilateral converge
```

---

## Session log (append-only)

**2026-05-08 10:15 AEST** — Phase 8 implementation complete on local. 4 substantive folds from round-1 audit shipped as authorized: F1 (skills/ + lib/ + apnex-*.tgz in files: array), F2 (sovereign-tarball bundling + transient swap helper + install.sh extension), F4 (prepare: npm run build), F7 (scoped install). Lib-extraction delivered: `scripts/build/lib/transient-package-swap.sh` with bash unit tests; `scripts/local/build-hub.sh` refactored to consume. Substrate-currency observation surfaced: `network-adapter` ↔ `message-router` import cycle requires 4-pass topological build; folded as workaround in `prepack-claude-plugin.sh`; filing follow-on idea. End-to-end operator-path test passes 12/12. Opening PR next.

---

## Canonical references

- `docs/designs/m-github-releases-plugin-distribution-design.md` — Design v1.0 (RATIFIED at commit `aca8d89` on `agent-lily/m-github-releases-plugin-design`)
- thread-499 — bilateral coordination (3 rounds; max 15 per Director generosity directive)
- idea-257 — anchor; Director-priority directive 2026-05-07
- idea-256 — foundation (build-info.json embedding shipped at PR #195)
- M-Deployment-Hygiene PR #192 — same workflow class; F7 fold lessons baked here
- `scripts/local/build-hub.sh` — reference for transient-swap pattern (now consumes shared lib)
- `feedback_design_phase_lib_extraction_for_substrate_bash.md` — discipline driving lib-extraction prescription
- `feedback_substrate_extension_wire_flow_integration_test.md` — calibration #62 14-instance discipline driving end-to-end shape verify
