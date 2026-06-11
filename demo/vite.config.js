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
const gfmSyntaxHtml = resolve(demoDir, "gfm-syntax/index.html");
const astHtml = resolve(demoDir, "ast/index.html");
const extendsHtml = resolve(demoDir, "extends/index.html");

export default defineConfig({
  root: demoDir,
  base: "./",
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
      "@style": resolve(rootDir, "style"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [
          resolve(rootDir, "src/transformer"),
          resolve(rootDir, "src/transformer/gfm"),
          resolve(rootDir, "src/transformer/extends"),
        ],
      },
    },
  },
  server: {
    open: "/index.html",
    port: 5173,
    fs: {
      allow: [rootDir],
    },
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
        gfmSyntax: gfmSyntaxHtml,
        ast: astHtml,
        extends: extendsHtml,
      },
    },
  },
});
