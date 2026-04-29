#!/usr/bin/env python3
"""Calibration ledger read-only Skill scaffolding (Phase 1; mission-65 / ADR-030).

Three read-only subcommands surface the architectural shape (Design v1.0 §2.3).
Verb names are PLACEHOLDERS pending idea-121 (API v2.0 tool-surface) ratification.

Usage:
  calibrations.py list [--class CLASS] [--status STATUS] [--mission MISSION] [--tele TELE]
  calibrations.py show <id-or-slug>
  calibrations.py status

The ledger lives at docs/calibrations.yaml (resolved relative to this script's
repo). Phase 1 is read-only; write authority defers to Phase 2+ per ADR-030.
"""

from __future__ import annotations

import argparse
import sys
from collections import Counter
from pathlib import Path

import yaml


def _resolve_ledger_path() -> Path:
    here = Path(__file__).resolve()
    repo_root = here.parents[2]
    return repo_root / "docs" / "calibrations.yaml"


def _load() -> dict:
    path = _resolve_ledger_path()
    if not path.exists():
        sys.exit(f"calibrations.yaml not found at {path}")
    with path.open() as f:
        return yaml.safe_load(f) or {}


def cmd_list(args: argparse.Namespace) -> None:
    doc = _load()
    rows = doc.get("calibrations") or []

    if args.cls:
        rows = [c for c in rows if c.get("class") == args.cls]
    if args.status:
        rows = [c for c in rows if c.get("status") == args.status]
    if args.mission:
        rows = [c for c in rows if (c.get("origin") or "").startswith(args.mission)]
    if args.tele:
        rows = [c for c in rows if args.tele in (c.get("tele_alignment") or [])]

    if not rows:
        print("(no calibrations match filter)")
        return

    width_id = max(len(str(c["id"])) for c in rows)
    width_status = max(len(c["status"]) for c in rows)
    for c in rows:
        print(
            f"#{c['id']:<{width_id}}  "
            f"[{c['class']:<11}]  "
            f"{c['status']:<{width_status}}  "
            f"{c['title']}"
        )
    print(f"\n({len(rows)} entries)")


def cmd_show(args: argparse.Namespace) -> None:
    doc = _load()
    target = args.id_or_slug

    try:
        target_int = int(target)
    except ValueError:
        target_int = None

    if target_int is not None:
        match = next(
            (c for c in (doc.get("calibrations") or []) if c["id"] == target_int),
            None,
        )
        if match is None:
            sys.exit(f"calibration #{target_int} not found")
        _render_calibration(match, doc)
        return

    match = next(
        (p for p in (doc.get("patterns") or []) if p["id"] == target),
        None,
    )
    if match is None:
        sys.exit(f"pattern '{target}' not found (also tried as int)")
    _render_pattern(match, doc)


def _render_calibration(c: dict, doc: dict) -> None:
    print(f"calibration #{c['id']} — {c['title']}")
    print(f"  class:        {c['class']}")
    print(f"  origin:       {c['origin']}")
    if c.get("surfaced_at"):
        print(f"  surfaced_at:  {c['surfaced_at']}")
    print(f"  status:       {c['status']}")
    if c.get("closure_pr"):
        print(f"  closure_pr:   #{c['closure_pr']}")
    if c.get("closure_mechanism"):
        print(f"  closure_mechanism:")
        for line in c["closure_mechanism"].rstrip().splitlines():
            print(f"    {line}")
    if c.get("pattern_membership"):
        print(f"  pattern_membership:")
        patterns_by_id = {p["id"]: p for p in (doc.get("patterns") or [])}
        for slug in c["pattern_membership"]:
            p = patterns_by_id.get(slug)
            label = p["title"] if p else "(unknown — cross-link broken)"
            print(f"    - {slug}: {label}")
    if c.get("cross_refs"):
        print(f"  cross_refs:")
        for ref in c["cross_refs"]:
            print(f"    - {ref}")
    if c.get("tele_alignment"):
        print(f"  tele_alignment: {', '.join(c['tele_alignment'])}")


def _render_pattern(p: dict, doc: dict) -> None:
    print(f"pattern {p['id']} — {p['title']}")
    print(f"  origin: {p['origin']}")
    print(f"  description:")
    for line in p["description"].rstrip().splitlines():
        print(f"    {line}")
    print(f"  surfaced_by_calibrations:")
    calibs_by_id = {c["id"]: c for c in (doc.get("calibrations") or [])}
    for cid in p.get("surfaced_by_calibrations") or []:
        c = calibs_by_id.get(cid)
        label = c["title"] if c else "(unknown — cross-link broken)"
        print(f"    - #{cid}: {label}")
    if p.get("methodology_doc_subsection"):
        print(f"  methodology_doc_subsection: {p['methodology_doc_subsection']}")


def cmd_status(args: argparse.Namespace) -> None:
    doc = _load()
    calibs = doc.get("calibrations") or []
    patterns = doc.get("patterns") or []

    print(f"schema_version: {doc.get('schema_version', '?')}")
    print(f"calibrations:   {len(calibs)}")
    print(f"patterns:       {len(patterns)}")
    print()

    print("by status:")
    for status, n in Counter(c["status"] for c in calibs).most_common():
        print(f"  {status:<22} {n}")

    print("\nby class:")
    for cls, n in Counter(c["class"] for c in calibs).most_common():
        print(f"  {cls:<22} {n}")

    print("\nby mission origin:")
    by_mission: Counter[str] = Counter()
    for c in calibs:
        origin = c.get("origin") or ""
        head = origin.split("-W")[0] if "-W" in origin else origin
        by_mission[head] += 1
    for mission, n in sorted(by_mission.items()):
        print(f"  {mission:<22} {n}")

    print("\nby tele_alignment:")
    by_tele: Counter[str] = Counter()
    for c in calibs:
        for tele in c.get("tele_alignment") or []:
            by_tele[tele] += 1
    for tele, n in by_tele.most_common():
        print(f"  {tele:<22} {n}")
    untagged = sum(1 for c in calibs if not c.get("tele_alignment"))
    print(f"  (untagged)             {untagged}")

    if patterns:
        print("\npatterns:")
        for p in patterns:
            members = p.get("surfaced_by_calibrations") or []
            print(f"  {p['id']:<60} ({len(members)} member{'s' if len(members) != 1 else ''})")


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="calibrations", description=__doc__.split("\n\n")[0])
    sub = p.add_subparsers(dest="cmd", required=True)

    p_list = sub.add_parser("list", help="list calibrations with optional filters")
    p_list.add_argument("--class", dest="cls", help="filter by class (substrate | methodology)")
    p_list.add_argument("--status", help="filter by status")
    p_list.add_argument("--mission", help="filter by mission prefix (e.g. mission-64)")
    p_list.add_argument("--tele", help="filter by tele id (e.g. tele-3)")
    p_list.set_defaults(func=cmd_list)

    p_show = sub.add_parser("show", help="show calibration (int id) or pattern (slug)")
    p_show.add_argument("id_or_slug", help="calibration id (integer) or pattern slug (kebab-case)")
    p_show.set_defaults(func=cmd_show)

    p_status = sub.add_parser("status", help="aggregate cross-mission counts + tele-aligned slices")
    p_status.set_defaults(func=cmd_status)

    return p


def main() -> None:
    args = build_parser().parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
