# tpl/agents-lean.jq — lean Agent projection template for get-agents.sh
#
# Mission-66 W1+W2 commit 7a (architect-portion) + post-M66 fix-forwards.
#
# Lean projection: id + name + role + livenessState + activityState only.
# Field names camelCase; buildTable() applies SNAKE_CASE heading transformation.
# For terse view (operator quick-glance; CI parse-friendly).
#
# Use case: `get-agents.sh --lean` for compact output; `get-agents.sh` (no
# flag) defaults to verbose tpl/agents.jq.

if type == "array" then
    [
        .[] | {
            id: (.id // .agentId // "?"),
            name: (.name // "?"),
            role: (.role // "?"),
            cognitiveTTL: (if .cognitiveTTL == null then "?" else .cognitiveTTL end),
            transportTTL: (if .transportTTL == null then "?" else .transportTTL end),
            activityState: (.activityState // "?")
        }
    ]
else
    .
end
