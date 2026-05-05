#!/bin/bash
# test-mod.core.sh — unit tests for scripts/local/mod.core (mission-75 v1.0)
#
# Per Design v1.0 §6.3 — verifies buildTable() column alignment edges,
# empty/null/single-row inputs, and the deterministic camelCase →
# SNAKE_CASE header derivation discipline (e.g., cognitiveTTL →
# COGNITIVE_TTL) that mod.core's heredoc-jq filter implements.
#
# Pure bash; jq is the one substrate dependency (already in use; AG-7
# blanket exception). Exits non-zero on first failure with diagnostic.
#
# Usage: ./test-mod.core.sh

set -euo pipefail

SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"

# Suppress color codes during tests (compare against literal output).
CYAN=""
NC=""

# shellcheck source=./mod.core
source "${SCRIPT_DIR}/mod.core"

PASS=0
FAIL=0

assert_eq() {
    local name="$1"
    local expected="$2"
    local actual="$3"
    if [[ "$expected" == "$actual" ]]; then
        echo "  ✓ ${name}"
        PASS=$((PASS + 1))
    else
        echo "  ✗ ${name}" >&2
        echo "    expected: ${expected}" >&2
        echo "    actual:   ${actual}" >&2
        FAIL=$((FAIL + 1))
    fi
}

# Strip leading whitespace from each line for compare-friendly output
# (column -t emits trailing whitespace that varies by terminal).
norm() {
    sed -E 's/[[:space:]]+/ /g; s/^ //; s/ $//'
}

echo "test: empty input renders nothing"
out="$(buildTable "" 2>&1)"
assert_eq "empty string → no output" "" "$out"
out="$(buildTable "[]" 2>&1)"
assert_eq "empty array → no output" "" "$out"
out="$(buildTable "null" 2>&1)"
assert_eq "null → no output" "" "$out"

echo "test: single-row array renders header + row"
input='[{"id":"a","role":"engineer"}]'
out="$(buildTable "$input" | norm)"
expected="ID ROLE
a engineer"
assert_eq "single-row table" "$expected" "$out"

echo "test: camelCase → SNAKE_CASE header derivation (mission-75 v1.0)"
input='[{"cognitiveTTL":12,"transportTTL":5}]'
out="$(buildTable "$input" | norm)"
expected="COGNITIVE_TTL TRANSPORT_TTL
12 5"
assert_eq "camelCase round-trip (cognitiveTTL → COGNITIVE_TTL)" "$expected" "$out"

echo "test: multi-row alignment"
input='[{"id":"short","role":"r1"},{"id":"a-much-longer-id","role":"r2"}]'
out="$(buildTable "$input" | norm)"
expected="ID ROLE
short r1
a-much-longer-id r2"
assert_eq "multi-row alignment" "$expected" "$out"

echo "test: object input renders KEY/VALUE table"
input='{"foo":"bar","baz":"qux"}'
out="$(buildTable "$input" | norm)"
expected="KEY VALUE
foo bar
baz qux"
assert_eq "object → KEY/VALUE table" "$expected" "$out"

echo
echo "Result: ${PASS} pass / ${FAIL} fail"
if [[ "$FAIL" -gt 0 ]]; then
    exit 1
fi
