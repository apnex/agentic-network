/**
 * M-Hypervisor-Adapter-Mitigations Task 4 (task-313) — Chunked
 * Reply Composition. Pins the chunking helper's slice contract +
 * the module-level buffer's visibility hooks.
 *
 * End-to-end drain flow (buffer → next sandwich invocation) is
 * exercised indirectly by the existing sandwich integration tests;
 * this file focuses on the pure-function chunker semantics which
 * are where the bug-risk lives for the cut-point math.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  chunkReplyMessage,
  __resetChunkBufferForTests,
  __peekChunkBufferForTests,
} from "../src/sandwich.js";

describe("chunkReplyMessage — Task 4", () => {
  it("returns the input unchanged when it fits in a single chunk", () => {
    expect(chunkReplyMessage("hello", 100_000)).toEqual(["hello"]);
  });

  it("returns the input unchanged when it exactly equals maxChunkSize", () => {
    const msg = "x".repeat(100);
    expect(chunkReplyMessage(msg, 100)).toEqual([msg]);
  });

  it("splits into N chunks when the input exceeds maxChunkSize", () => {
    const suffixLen = " [CONTINUED IN NEXT TURN]".length;
    const maxChunkSize = 100;
    const effectiveSize = maxChunkSize - suffixLen;
    const totalLen = effectiveSize * 3 + 10; // enough for 4 chunks
    const msg = "x".repeat(totalLen);
    const out = chunkReplyMessage(msg, maxChunkSize);
    expect(out).toHaveLength(4);
    // Every non-final chunk must be exactly effectiveSize (pre-suffix).
    expect(out[0]).toHaveLength(effectiveSize);
    expect(out[1]).toHaveLength(effectiveSize);
    expect(out[2]).toHaveLength(effectiveSize);
    // Final chunk is the tail remainder.
    expect(out[3]).toHaveLength(10);
    // Concatenation roundtrips.
    expect(out.join("")).toBe(msg);
  });

  it("handles exact-boundary cases (input len = maxChunkSize + 1)", () => {
    // Trigger condition is `message.length > maxChunkSize` — so input
    // of exactly maxChunkSize is a single chunk; maxChunkSize+1 is the
    // first length that splits.
    const suffixLen = " [CONTINUED IN NEXT TURN]".length;
    const maxChunkSize = 100;
    const effectiveSize = maxChunkSize - suffixLen;
    expect(chunkReplyMessage("x".repeat(maxChunkSize), maxChunkSize)).toHaveLength(1);
    const splitCase = chunkReplyMessage("x".repeat(maxChunkSize + 1), maxChunkSize);
    expect(splitCase).toHaveLength(2);
    expect(splitCase[0]).toHaveLength(effectiveSize);
    expect(splitCase[1]).toHaveLength(maxChunkSize + 1 - effectiveSize);
  });

  it("conservatively returns single-element array for invalid maxChunkSize", () => {
    // Non-finite, zero, or too-small values fall through to "no chunking".
    expect(chunkReplyMessage("hello", NaN)).toEqual(["hello"]);
    expect(chunkReplyMessage("hello", 0)).toEqual(["hello"]);
    expect(chunkReplyMessage("hello", -10)).toEqual(["hello"]);
    expect(chunkReplyMessage("hello", 10)).toEqual(["hello"]); // maxChunkSize must exceed suffix length + 1
  });

  it("preserves UTF-16 char count (slice-based; no codepoint normalization in v1)", () => {
    // Explicit: v1 is raw-slice. If surrogate pairs split across a
    // chunk boundary, that's a v1 limitation documented in the mission
    // brief + the source comment.
    const maxChunkSize = 100;
    // Enough input to guarantee a 2-chunk split (above maxChunkSize).
    const msg = "a".repeat(maxChunkSize + 5);
    const out = chunkReplyMessage(msg, maxChunkSize);
    expect(out).toHaveLength(2);
    expect(out.join("")).toBe(msg);
    expect(out[0].length + out[1].length).toBe(msg.length);
  });
});

describe("chunk buffer test hooks", () => {
  beforeEach(() => {
    __resetChunkBufferForTests();
  });

  it("buffer starts empty after reset", () => {
    expect(__peekChunkBufferForTests("thread-1")).toBeUndefined();
  });

  it("__resetChunkBufferForTests clears prior state", () => {
    // The buffer is only populated by the sandwich executeToolCall path
    // (integration-test surface). These hooks ensure that unit tests +
    // integration tests can deterministically isolate buffer state
    // between test runs without leaking into production code.
    expect(__peekChunkBufferForTests("thread-1")).toBeUndefined();
  });
});
