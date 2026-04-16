#!/usr/bin/env python3
"""
Parse and render Architect SSE responses for terminal display.
Reads raw SSE response from stdin, outputs formatted terminal text.
"""

import sys
import re
import shutil

# ── ANSI color codes ──────────────────────────────────────────────
BOLD = "\033[1m"
DIM = "\033[2m"
ITALIC = "\033[3m"
CYAN = "\033[36m"
YELLOW = "\033[33m"
GREEN = "\033[32m"
MAGENTA = "\033[35m"
RESET = "\033[0m"

term_width = min(shutil.get_terminal_size().columns, 120)


def apply_inline(text):
    """Apply inline markdown formatting (bold, italic, code)."""
    text = re.sub(r"`([^`]+)`", f"{CYAN}\\1{RESET}", text)
    text = re.sub(r"\*\*\*([^*]+)\*\*\*", f"{BOLD}{ITALIC}\\1{RESET}", text)
    text = re.sub(r"\*\*([^*]+)\*\*", f"{BOLD}\\1{RESET}", text)
    text = re.sub(r"\*([^*]+)\*", f"{ITALIC}\\1{RESET}", text)
    return text


def strip_ansi(text):
    """Remove ANSI escape codes to get visible length."""
    return re.sub(r"\033\[[0-9;]*m", "", text)


def render_table(table_lines):
    """Render a complete markdown table with aligned columns."""
    # Parse all rows into cells
    rows = []
    separator_indices = []
    for i, line in enumerate(table_lines):
        stripped = line.strip()
        if re.match(r"^\|[\s\-:|]+\|$", stripped):
            separator_indices.append(i)
            rows.append(None)  # placeholder for separator
        else:
            cells = [c.strip() for c in stripped.strip("|").split("|")]
            rows.append(cells)

    # Calculate max width for each column (from actual data, ignoring ANSI)
    max_cols = max(len(r) for r in rows if r is not None)
    col_widths = [0] * max_cols
    for row in rows:
        if row is None:
            continue
        for j, cell in enumerate(row):
            if j < max_cols:
                col_widths[j] = max(col_widths[j], len(cell))

    # Render each row
    output = []
    for i, row in enumerate(rows):
        if row is None:
            # Separator row — use calculated widths
            output.append("  " + "─┼─".join("─" * w for w in col_widths))
        elif i == 0 or (len(separator_indices) > 0 and i < separator_indices[0]):
            # Header row (before first separator) — render in bold
            padded = []
            for j, cell in enumerate(row):
                w = col_widths[j] if j < len(col_widths) else len(cell)
                padded.append(f"{BOLD}{cell:<{w}}{RESET}")
            output.append("  " + " │ ".join(padded))
        else:
            # Data row — apply inline formatting, pad to width
            padded = []
            for j, cell in enumerate(row):
                w = col_widths[j] if j < len(col_widths) else len(cell)
                formatted = apply_inline(cell)
                # Pad based on visible length (excluding ANSI codes)
                visible_len = len(strip_ansi(formatted))
                padding = w - visible_len
                if padding > 0:
                    formatted += " " * padding
                padded.append(formatted)
            output.append("  " + " │ ".join(padded))

    return output


def render_lines(text):
    """Render all lines, collecting table rows for batch rendering."""
    lines = text.split("\n")
    output = []
    table_buffer = []

    def flush_table():
        if table_buffer:
            output.extend(render_table(table_buffer))
            table_buffer.clear()

    for line in lines:
        stripped = line.strip()

        # Detect table rows
        if stripped.startswith("|") and stripped.endswith("|"):
            table_buffer.append(stripped)
            continue

        # Not a table row — flush any buffered table first
        flush_table()

        # Headings
        if stripped.startswith("### "):
            output.append(f"  {BOLD}{YELLOW}{stripped[4:]}{RESET}")
        elif stripped.startswith("## "):
            output.append(f"  {BOLD}{YELLOW}{stripped[3:]}{RESET}")
        elif stripped.startswith("# "):
            output.append(f"  {BOLD}{YELLOW}{stripped[2:]}{RESET}")
        # Bullet points
        elif stripped.startswith("- ") or stripped.startswith("* "):
            content = apply_inline(stripped[2:])
            output.append(f"  {GREEN}•{RESET} {content}")
        # Numbered lists
        elif re.match(r"^(\d+)\.\s+(.*)", stripped):
            m = re.match(r"^(\d+)\.\s+(.*)", stripped)
            content = apply_inline(m.group(2))
            output.append(f"  {GREEN}{m.group(1)}.{RESET} {content}")
        # Empty line
        elif not stripped:
            output.append("")
        # Regular text
        else:
            output.append(f"  {apply_inline(stripped)}")

    # Flush any trailing table
    flush_table()

    return output


def main():
    data = sys.stdin.read()

    # ── Tool calls ────────────────────────────────────────────────
    tool_calls = re.findall(r'"functionCall":\{[^}]*"name":"([^"]+)"', data)
    seen_tools = set()
    for tool in tool_calls:
        if tool not in seen_tools:
            seen_tools.add(tool)
            if tool == "send_directive":
                match = re.search(r'"directive":"((?:[^"\\]|\\.)*)"', data)
                directive = ""
                if match:
                    try:
                        directive = match.group(1).encode().decode("unicode_escape")
                    except Exception:
                        directive = match.group(1)
                print(f"  {DIM}[Tool] send_directive: {directive}{RESET}")
            else:
                print(f"  {DIM}[Tool] {tool}{RESET}")

    # ── Clear the "Thinking..." line ─────────────────────────────
    # \r moves cursor to start of line, \033[K clears to end of line
    sys.stdout.write("\r\033[K")
    sys.stdout.flush()

    # ── Text response ─────────────────────────────────────────────
    texts = re.findall(r'"text":"((?:[^"\\]|\\.)*)"', data)
    if not texts:
        print(f"{CYAN}[Architect]{RESET} (no text response)")
        return

    # Decode unicode escapes from the last text (final model response)
    raw = texts[-1]
    try:
        final_text = raw.encode("raw_unicode_escape").decode("unicode_escape")
    except (UnicodeDecodeError, UnicodeEncodeError):
        final_text = raw.replace("\\n", "\n").replace('\\"', '"')

    print(f"{CYAN}[Architect]{RESET}")
    for line in render_lines(final_text):
        print(line)


def main_text():
    """Render plain text input (new /chat/message API)."""
    text = sys.stdin.read().strip()
    if not text:
        print(f"{CYAN}[Architect]{RESET} (no response)")
        return
    for line in render_lines(text):
        print(line)


if __name__ == "__main__":
    if "--text" in sys.argv:
        main_text()
    else:
        main()
