import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    teardownTimeout: 10_000,
    // Disable watch by default for CI
    watch: false,
    // Run test files sequentially to avoid port conflicts
    fileParallelism: false,
  },
});
