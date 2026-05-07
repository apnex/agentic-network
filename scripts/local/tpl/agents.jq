# tpl/agents.jq — verbose Agent projection template for get-agents.sh
#
# Mission-66 W1+W2 commit 7a (architect-portion) + post-M66 fix-forwards
# (HUB_API_TOKEN rename / 2-step session handshake / SNAKE_CASE headings /
# version-column refactor / name field).
#
# Input: post-unwrap array of Agent records from .result.content[0].text.
# Pipeline:
#   1. Engineer commit 7b unwraps result.content[0].text (JSON-stringified);
#      this template projects the resulting array to column-friendly fields
#   2. Field names use camelCase; buildTable() in get-agents.sh transforms
#      camelCase → SNAKE_CASE for headings (e.g. activityState → ACTIVITY_STATE)
#
# Version columns rationale (Director ratified post-#138 live-test):
#   - shimPlugin = clientMetadata.proxyVersion (claude-plugin shim version)
#   - adapter    = clientMetadata.sdkVersion stripped of @apnex/network-adapter@
#                  prefix (network-adapter SDK version)
#   - Useful for determining if 2 different clients have the same underlying
#     adapter code
#
# Build-identity columns (M-Build-Identity-AdvisoryTag — idea-256):
#   - shimCommit    = .advisoryTags.proxyCommitSha + (-dirty suffix if proxyDirty)
#   - adapterCommit = .advisoryTags.sdkCommitSha   + (-dirty suffix if sdkDirty)
#   Distinguishes two clients at the same package.json version but different
#   underlying compiled JavaScript. Field source: shim reads each package's
#   dist/build-info.json (written by prepack hook) → emits via
#   clientMetadata.{proxy,sdk}{CommitSha,Dirty} → Hub deriveAdvisoryTags
#   projects to advisoryTags. The "-dirty" suffix is render-layer
#   concatenation only; advisoryTags fields stay hex-only + boolean.
#
# Reference: /home/apnex/taceng/table/tpl/*.jq pattern (memory:
# reference_prism_table_pattern.md).

if type == "array" then
    [
        .[] | {
            id: (.id // .agentId // "?"),
            name: (.name // "?"),
            role: (.role // "?"),
            cognitiveTTL: (if .cognitiveTTL == null then "?" else .cognitiveTTL end),
            transportTTL: (if .transportTTL == null then "?" else .transportTTL end),
            activityState: (.activityState // "?"),
            shimPlugin: (
                ((.clientMetadata.proxyName // "?") | split("/") | last | sub("-plugin$"; ""))
                + "-"
                + (.clientMetadata.proxyVersion // "?")
            ),
            adapter: ((.clientMetadata.sdkVersion // "?") | split("@") | last),
            shimCommit: (
                (.advisoryTags.proxyCommitSha // "?")
                + (if .advisoryTags.proxyDirty == true then "-dirty" else "" end)
            ),
            adapterCommit: (
                (.advisoryTags.sdkCommitSha // "?")
                + (if .advisoryTags.sdkDirty == true then "-dirty" else "" end)
            ),
            llmModel: (.advisoryTags.llmModel // "?"),
            pid: (.clientMetadata.pid // "?"),
            labels: (.labels // {} | to_entries | map("\(.key)=\(.value)") | join(",") | if . == "" then "-" else . end)
        }
    ]
else
    .
end
