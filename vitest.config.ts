import { defineConfig } from "vitest/config";
import path from "path";

// Fixed before anything constructs a Date. The calendar formats dates and
// times in local time, so tests need a known zone to assert against.
process.env.TZ = "America/Los_Angeles";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: true,
  },
});
