#!/usr/bin/env python3
"""
Architect telemetry analyzer — aggregates per-thread Gemini usage and
cognitive-layer tool-call events from Cloud Run logs, compares against
the Phase 2b exit thresholds in targets.yaml, and emits a structured
verdict.

Designed as the durable regression-detection substrate for
M-Cognitive-Hypervisor Phase 2b+ (tele-10 candidate, idea-116). Run it
after any architect-agent deploy that changes sandwich / llm / hub-
adapter code to confirm no precision-context-engineering regression.

Usage:
  scripts/architect-telemetry/aggregate.py \\
      --revision architect-agent-00045-2pb \\
      --freshness 30m \\
      [--thread-prefix thread-18] \\
      [--targets scripts/architect-telemetry/targets.yaml] \\
      [--output text|yaml|json]

Exit codes:
  0 — all required targets pass
  1 — one or more required targets fail
  2 — error (bad args, gcloud failure, no events)
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from statistics import median


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--revision", required=True, help="Cloud Run revision name (e.g. architect-agent-00045-2pb)")
    p.add_argument("--freshness", default="1h", help="gcloud logging --freshness window (default 1h)")
    p.add_argument("--thread-prefix", default="thread-", help="Only aggregate sessionIds starting with this prefix (default: thread-)")
    p.add_argument("--targets", default=str(Path(__file__).parent / "targets.yaml"), help="Path to targets.yaml")
    p.add_argument("--output", choices=["text", "yaml", "json"], default="text")
    p.add_argument("--limit", type=int, default=500, help="Max log entries to pull (default 500)")
    return p.parse_args()


def load_targets(path: str) -> dict:
    # Minimal YAML subset parser — avoid PyYAML dependency.
    # The targets.yaml file uses only strings, numbers, booleans, nested dicts, and scalars.
    lines = Path(path).read_text().splitlines()
    out: dict = {}
    stack = [(0, out)]
    for raw in lines:
        stripped = raw.rstrip()
        if not stripped or stripped.lstrip().startswith("#"):
            continue
        indent = len(stripped) - len(stripped.lstrip())
        line = stripped.strip()
        while len(stack) > 1 and stack[-1][0] >= indent:
            stack.pop()
        if ": " in line:
            k, v = line.split(": ", 1)
            k = k.strip()
            v = v.strip().strip('"')
            stack[-1][1][k] = coerce(v)
        elif line.endswith(":"):
            k = line[:-1].strip()
            d: dict = {}
            stack[-1][1][k] = d
            stack.append((indent, d))
        # skip list items — targets.yaml doesn't use them in this iteration
    return out


def coerce(v: str):
    if v in ("true", "True"): return True
    if v in ("false", "False"): return False
    if v == "null": return None
    try: return int(v)
    except ValueError: pass
    try: return float(v)
    except ValueError: pass
    return v


def fetch_log_entries(revision: str, freshness: str, limit: int) -> list[str]:
    """Pull [ArchitectTelemetry] + [Sandwich] log lines for the revision."""
    filter_expr = (
        f'resource.type=cloud_run_revision '
        f'AND resource.labels.revision_name={revision} '
        f'AND (textPayload:"[ArchitectTelemetry]" '
        f'  OR textPayload:"[Sandwich] thread-reply" '
        f'  OR textPayload:"MAX_TOOL_ROUNDS exhausted" '
        f'  OR textPayload:"out-of-scope")'
    )
    cmd = [
        "gcloud", "logging", "read", filter_expr,
        f"--limit={limit}",
        "--format=value(textPayload)",
        f"--freshness={freshness}",
    ]
    try:
        out = subprocess.check_output(cmd, stderr=subprocess.PIPE, text=True)
    except subprocess.CalledProcessError as e:
        stderr = e.stderr.decode("utf-8", errors="replace") if isinstance(e.stderr, bytes) else (e.stderr or "")
        sys.exit(f"gcloud logging read failed: {stderr}")
    return out.splitlines()


@dataclass
class ThreadStats:
    events: int = 0
    tokens_total: int = 0
    finish_reasons: Counter = field(default_factory=Counter)
    rounds_seen: set[int] = field(default_factory=set)
    hit_max_tool_rounds: bool = False
    title: str = ""


@dataclass
class Totals:
    llm_usage_events: int = 0
    tool_call_events: int = 0
    tool_error_events: int = 0
    out_of_scope_rejections: int = 0
    max_tool_rounds_events: int = 0
    virtual_tokens_saved: int = 0
    summarized_tool_calls: int = 0
    cache_hits: int = 0
    cache_misses: int = 0


def aggregate(lines: list[str], thread_prefix: str) -> tuple[Totals, dict[str, ThreadStats]]:
    threads: dict[str, ThreadStats] = defaultdict(ThreadStats)
    totals = Totals()

    for line in lines:
        # [ArchitectTelemetry] JSON events
        if "[ArchitectTelemetry]" in line:
            m = re.search(r"\{.*\}", line)
            if not m:
                continue
            try:
                ev = json.loads(m.group(0))
            except json.JSONDecodeError:
                continue
            kind = ev.get("kind")
            sid = ev.get("sessionId", "")
            if kind == "llm_usage":
                totals.llm_usage_events += 1
                if sid.startswith(thread_prefix):
                    t = threads[sid]
                    t.events += 1
                    t.tokens_total += int(ev.get("llmTotalTokens") or 0)
                    fr = ev.get("llmFinishReason")
                    if fr:
                        t.finish_reasons[fr] += 1
                    rn = ev.get("llmRound")
                    if isinstance(rn, int):
                        t.rounds_seen.add(rn)
            elif kind == "tool_call":
                totals.tool_call_events += 1
                tags = ev.get("tags") or {}
                if tags.get("summarized") == "true":
                    totals.summarized_tool_calls += 1
                    vts = tags.get("virtualTokensSaved")
                    if vts:
                        try: totals.virtual_tokens_saved += int(vts)
                        except ValueError: pass
                if tags.get("cacheHit") == "true":
                    totals.cache_hits += 1
                elif tags.get("cacheHit") == "false":
                    totals.cache_misses += 1
            elif kind == "tool_error":
                totals.tool_error_events += 1

        # [Sandwich] MAX_TOOL_ROUNDS events
        elif "MAX_TOOL_ROUNDS exhausted" in line or "hit MAX_TOOL_ROUNDS" in line:
            totals.max_tool_rounds_events += 1
            m = re.search(r"(thread-\d+)", line)
            if m and m.group(1).startswith(thread_prefix):
                threads[m.group(1)].hit_max_tool_rounds = True

        # [Sandwich] out-of-scope rejections
        elif "out-of-scope tool" in line:
            totals.out_of_scope_rejections += 1

    return totals, dict(threads)


def percentile(values: list[int], pct: float) -> int:
    if not values:
        return 0
    values = sorted(values)
    k = max(0, min(len(values) - 1, int(round((len(values) - 1) * pct / 100))))
    return values[k]


def check_target(spec: dict, actual) -> tuple[bool, str]:
    op = spec.get("operator")
    target = spec.get("value")
    if op == "eq":
        return (actual == target, f"actual={actual} target=={target}")
    if op == "lte":
        return (actual <= target, f"actual={actual} target<={target}")
    if op == "gte":
        return (actual >= target, f"actual={actual} target>={target}")
    if op == "gt":
        return (actual > target, f"actual={actual} target>{target}")
    if op == "lt":
        return (actual < target, f"actual={actual} target<{target}")
    return (False, f"unknown operator {op!r}")


def evaluate(totals: Totals, threads: dict[str, ThreadStats], targets_yaml: dict) -> dict:
    tokens_per_thread = sorted(t.tokens_total for t in threads.values() if t.tokens_total > 0)
    mtr_rate_pct = (
        100.0 * sum(1 for t in threads.values() if t.hit_max_tool_rounds) / len(threads)
        if threads else 0.0
    )
    summarize_rate_pct = (
        100.0 * totals.summarized_tool_calls / totals.tool_call_events
        if totals.tool_call_events else 0.0
    )

    metrics = {
        "out_of_scope_rejections": totals.out_of_scope_rejections,
        "max_tool_rounds_rate_pct": round(mtr_rate_pct, 1),
        "gemini_tokens_per_thread_p50": percentile(tokens_per_thread, 50),
        "gemini_tokens_per_thread_p95": percentile(tokens_per_thread, 95),
        "virtual_tokens_saved": totals.virtual_tokens_saved,
        "summarize_rate_pct": round(summarize_rate_pct, 1),
        "tool_call_telemetry_events_min": totals.tool_call_events,
    }

    results = {}
    all_required_pass = True
    any_fail = False
    target_specs = targets_yaml.get("targets", {})
    for name, spec in target_specs.items():
        if name not in metrics:
            continue
        actual = metrics[name]
        passed, detail = check_target(spec, actual)
        results[name] = {
            "required": spec.get("required", False),
            "pass": passed,
            "detail": detail,
            "comment": spec.get("comment", ""),
        }
        if not passed:
            any_fail = True
            if spec.get("required", False):
                all_required_pass = False

    verdict = "pass" if all_required_pass and not any_fail else ("partial" if all_required_pass else "fail")

    return {
        "verdict": verdict,
        "metrics": metrics,
        "targets": results,
    }


def render_text(revision: str, totals: Totals, threads: dict[str, ThreadStats], evaluation: dict) -> str:
    lines = []
    lines.append(f"=== Architect Telemetry Report — {revision} ===")
    lines.append("")
    lines.append(f"Totals:")
    lines.append(f"  llm_usage events:    {totals.llm_usage_events}")
    lines.append(f"  tool_call events:    {totals.tool_call_events}")
    lines.append(f"  tool_error events:   {totals.tool_error_events}")
    lines.append(f"  out-of-scope:        {totals.out_of_scope_rejections}")
    lines.append(f"  MAX_TOOL_ROUNDS:     {totals.max_tool_rounds_events}")
    lines.append(f"  summarized calls:    {totals.summarized_tool_calls}")
    lines.append(f"  cache hits/misses:   {totals.cache_hits}/{totals.cache_misses}")
    lines.append(f"  Virtual Tokens Saved: {totals.virtual_tokens_saved}")
    lines.append("")
    lines.append(f"Threads sampled: {len(threads)}")
    lines.append(f"  {'thread':<14} {'events':>6} {'tokens':>8} {'MTR':>4}  finish_reasons")
    tokens_by_thread = sorted(threads.items(), key=lambda kv: kv[1].tokens_total, reverse=True)
    for tid, t in tokens_by_thread:
        fr = ",".join(f"{k}={v}" for k, v in t.finish_reasons.most_common())
        mtr = "YES" if t.hit_max_tool_rounds else "—"
        lines.append(f"  {tid:<14} {t.events:>6} {t.tokens_total:>8} {mtr:>4}  {fr}")

    m = evaluation["metrics"]
    lines.append("")
    lines.append(f"Metrics:")
    lines.append(f"  gemini_tokens_per_thread_p50: {m['gemini_tokens_per_thread_p50']:,}")
    lines.append(f"  gemini_tokens_per_thread_p95: {m['gemini_tokens_per_thread_p95']:,}")
    lines.append(f"  max_tool_rounds_rate: {m['max_tool_rounds_rate_pct']}%")
    lines.append(f"  summarize_rate: {m['summarize_rate_pct']}%")

    lines.append("")
    lines.append(f"Targets ({evaluation['verdict'].upper()}):")
    for name, r in evaluation["targets"].items():
        status = "✓" if r["pass"] else "✗"
        req = "[req]" if r["required"] else "[obs]"
        lines.append(f"  {status} {req} {name}: {r['detail']}")
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    targets_yaml = load_targets(args.targets)
    lines = fetch_log_entries(args.revision, args.freshness, args.limit)
    if not lines:
        print(f"No log entries for {args.revision} within --freshness={args.freshness}", file=sys.stderr)
        return 2

    totals, threads = aggregate(lines, args.thread_prefix)
    evaluation = evaluate(totals, threads, targets_yaml)

    if args.output == "json":
        print(json.dumps({
            "revision": args.revision,
            "freshness": args.freshness,
            "totals": totals.__dict__,
            "threads": {
                tid: {
                    "events": t.events,
                    "tokens_total": t.tokens_total,
                    "finish_reasons": dict(t.finish_reasons),
                    "hit_max_tool_rounds": t.hit_max_tool_rounds,
                }
                for tid, t in threads.items()
            },
            **evaluation,
        }, indent=2))
    elif args.output == "yaml":
        # Emit minimal YAML without dependency
        d = {
            "revision": args.revision,
            "verdict": evaluation["verdict"],
            "metrics": evaluation["metrics"],
            "targets": evaluation["targets"],
        }
        for k, v in d.items():
            if isinstance(v, dict):
                print(f"{k}:")
                for kk, vv in v.items():
                    if isinstance(vv, dict):
                        print(f"  {kk}:")
                        for kkk, vvv in vv.items():
                            print(f"    {kkk}: {json.dumps(vvv)}")
                    else:
                        print(f"  {kk}: {json.dumps(vv)}")
            else:
                print(f"{k}: {json.dumps(v)}")
    else:
        print(render_text(args.revision, totals, threads, evaluation))

    if evaluation["verdict"] == "fail":
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
