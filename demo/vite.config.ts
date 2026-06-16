/**
 * Demo 开发服务器：直接消费 src 源码，无需预编译 dist。
 */

import { defineConfig, type Plugin } from "vite";
import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const demoDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(demoDir, "..");
const astDocPath = resolve(demoDir, "test.md");

/** AST 调试台：将编辑内容写回 demo/test.md（仅 dev server） */
function astDocSavePlugin(): Plugin {
  return {
    name: "ast-doc-save",
    configureServer(server) {
      server.middlewares.use("/__ast/save-doc", async (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk as Buffer);
          }
          const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
            content?: unknown;
          };
          if (typeof body.content !== "string") {
            res.statusCode = 400;
            res.end("content required");
            return;
          }
          await writeFile(astDocPath, body.content, "utf8");
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.statusCode = 500;
          res.end(e instanceof Error ? e.message : String(e));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [astDocSavePlugin()],
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
