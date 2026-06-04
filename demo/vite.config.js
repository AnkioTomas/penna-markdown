/**
 * Demo：单页语法测试（index.html）。
 */

import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const demoDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(demoDir, "..");

const indexHtml = resolve(demoDir, "index.html");
const editorHtml = resolve(demoDir, "editor/index.html");
const converterHtml = resolve(demoDir, "converter/index.html");
const gfmHtml = resolve(demoDir, "gfm/index.html");
const commonmarkHtml = resolve(demoDir, "commonmark/index.html");
const astHtml = resolve(demoDir, "ast/index.html");

export default defineConfig({
  root: demoDir,
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
    },
  },
  server: {
    open: "/index.html",
    port: 5173,
  },
  build: {
    outDir: resolve(demoDir, "../dist-demo"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: indexHtml,
        editor: editorHtml,
        converter: converterHtml,
        gfm: gfmHtml,
        commonmark: commonmarkHtml,
        ast: astHtml,
      },
    },
  },
});
