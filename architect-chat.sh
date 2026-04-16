#!/bin/bash
#
# architect-chat.sh — Chat with the Architect agent
#
# Usage:
#   ./architect-chat.sh "Your message here"   # single message mode
#   ./architect-chat.sh                        # interactive mode (type /exit to quit)
#
# The script creates a new session on first run and reuses it for subsequent calls.
# To start a fresh session, delete /tmp/architect_session_id or type /new in interactive mode.
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCHITECT_URL="https://architect-agent-614327680171.australia-southeast1.run.app"
SESSION_FILE="/tmp/architect_session_id"
PARSER="${SCRIPT_DIR}/clients/architect-chat/architect-parse.py"

# ── Session Management ────────────────────────────────────────────────

create_session() {
  SESSION_ID=$(curl -s -X POST "${ARCHITECT_URL}/chat/session" \
    -H "Content-Type: application/json" -d '{}' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
  echo "$SESSION_ID" > "$SESSION_FILE"
  echo "[System] New session: ${SESSION_ID}"
}

if [ -f "$SESSION_FILE" ]; then
  SESSION_ID=$(cat "$SESSION_FILE")
else
  create_session
fi

# ── Send and Display ──────────────────────────────────────────────────

send_message() {
  local MESSAGE="$1"

  # Show "Thinking..." on the same line — will be overwritten by the response
  echo -ne "\033[36m[Architect]\033[0m Thinking...\r"

  # JSON-encode the message safely
  local ENCODED
  ENCODED=$(echo "$MESSAGE" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))")

  # Send the message
  RESPONSE=$(curl -s -X POST "${ARCHITECT_URL}/chat/message" \
    -H "Content-Type: application/json" \
    -d "{
      \"session_id\": \"${SESSION_ID}\",
      \"message\": ${ENCODED}
    }")

  # Check for response text
  RESPONSE_TEXT=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('response', ''))
except:
    print('')
" 2>/dev/null)

  if [ -n "$RESPONSE_TEXT" ]; then
    # Clear the "Thinking..." line and render
    echo -ne "\r\033[K\033[36m[Architect]\033[0m\n"
    echo "$RESPONSE_TEXT" | python3 "${PARSER}" --text 2>/dev/null || echo "  $RESPONSE_TEXT"
  else
    # No response — stale session, retry with new session
    echo -ne "\r\033[K"
    echo "[System] Session expired, reconnecting..."
    create_session
    sleep 2  # Allow the Architect agent to initialize the new session

    echo -ne "\033[36m[Architect]\033[0m Thinking...\r"

    RESPONSE=$(curl -s -X POST "${ARCHITECT_URL}/chat/message" \
      -H "Content-Type: application/json" \
      -d "{
        \"session_id\": \"${SESSION_ID}\",
        \"message\": ${ENCODED}
      }")
    RESPONSE_TEXT=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('response', ''))
except:
    print('')
" 2>/dev/null)

    if [ -n "$RESPONSE_TEXT" ]; then
      echo -ne "\r\033[K\033[36m[Architect]\033[0m\n"
      echo "$RESPONSE_TEXT" | python3 "${PARSER}" --text 2>/dev/null || echo "  $RESPONSE_TEXT"
    else
      echo -ne "\r\033[K"
      echo "[System] Retry failed — Architect may be unavailable. Try again."
    fi
  fi
}

# ── Main ──────────────────────────────────────────────────────────────

if [ -n "$1" ]; then
  # Single message mode
  send_message "$1"
else
  # Interactive mode
  echo "[System] Architect Chat — type /exit to quit, /new for fresh session"
  while true; do
    echo ""
    echo -n "[Director] > "
    read -r MESSAGE

    # Handle commands
    case "$MESSAGE" in
      /exit|/quit|/q)
        echo "[System] Goodbye."
        exit 0
        ;;
      /new)
        create_session
        continue
        ;;
      "")
        continue
        ;;
    esac

    send_message "$MESSAGE"
  done
fi
