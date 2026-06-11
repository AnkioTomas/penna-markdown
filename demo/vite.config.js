/**
 * Demo 开发服务器：直接消费 src 源码，无需预编译 dist。
 */

import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const demoDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(demoDir, "..");

export default defineConfig({
  root: demoDir,
  base: "./",
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
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
});
