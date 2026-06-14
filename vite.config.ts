import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { spaHistoryFallback } from "./vite-plugins/spa-history-fallback";

export default defineConfig({
  plugins: [react(), spaHistoryFallback()],
  base: "/interview-prep-portal/",
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
