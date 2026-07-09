import { defineConfig } from "vite";
import fs from "fs";
import path from "path";

const rootDir = path.resolve(__dirname, "..");

function listDirEntries(dirPath: string, urlPath: string) {
  const base = urlPath.endsWith("/") ? urlPath : `${urlPath}/`;
  return fs
    .readdirSync(dirPath)
    .map((name) => {
      const filePath = path.join(dirPath, name);
      const stat = fs.statSync(filePath);
      return {
        name,
        isDir: stat.isDirectory(),
        href: `${base}${name}`,
        mtime: stat.mtimeMs,
        size: stat.size,
      };
    })
    .sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export default defineConfig({
  root: ".",
  server: {
    port: 5173,
    open: "/demo/",
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  plugins: [
    {
      name: "vite-plugin-directory-index",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url) return next();

          const url = new URL(req.url, "http://localhost");
          if (!url.searchParams.has("json")) return next();

          const dirPath = path.join(
            server.config.root,
            url.pathname.replace(/^\/+/, "") || ".",
          );
          if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
            return next();
          }

          const files = fs.readdirSync(dirPath);
          if (files.includes("index.html")) return next();

          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify(listDirEntries(dirPath, url.pathname)));
        });
      },
    },
  ],
});
