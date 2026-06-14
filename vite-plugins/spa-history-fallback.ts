// SPA fallback for `vite preview`. Without this, direct URL access like
// /applications returns 404 because vite preview only serves files from
// the dist directory — it doesn't fall back to index.html.
//
// Reference: https://vitejs.dev/config/server-options.html#server-historyapifallback

import type { Connect, Plugin, PluginOption } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const spaPlugin: Plugin = {
  name: "spa-history-fallback",
  configurePreviewServer(server: { middlewares: Connect.Server }) {
    server.middlewares.use((req, res, next) => {
      const url = req.url || "";
      if (
        url.startsWith("/assets/") ||
        url.startsWith("/@") ||
        url === "/" ||
        url === "/index.html" ||
        /\.[a-zA-Z0-9]+$/.test(url.split("?")[0])
      ) {
        return next();
      }
      try {
        const html = readFileSync(resolve(__dirname, "../dist/index.html"), "utf-8");
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html");
        res.end(html);
      } catch {
        next();
      }
    });
  },
};

export function spaHistoryFallback(): PluginOption {
  return spaPlugin;
}
