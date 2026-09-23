import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["apps/api/tests/e2e/**/*.test.ts"],
    environment: "node",
    testTimeout: 30_000,
  },
});
