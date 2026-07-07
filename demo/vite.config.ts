import { defineConfig } from "vite";
import fs from "fs";
import path from "path";

const rootDir = path.resolve(__dirname, "..");
const transformerDir = path.resolve(rootDir, "src/transformer");

function resolveDirPath(root: string, urlPath: string): string {
  const rel = urlPath.replace(/^\/+/, "").replace(/\/+$/, "") || ".";
  const inRoot = path.join(root, rel);
  if (fs.existsSync(inRoot)) return inRoot;
  const inParent = path.resolve(root, "..", rel);
  if (fs.existsSync(inParent)) return inParent;
  return inRoot;
}

export default defineConfig({
  root: ".",
  server: {
    port: 5173,
    open: "/demo/",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [
          transformerDir,
          path.resolve(transformerDir, "gfm"),
          path.resolve(transformerDir, "extends"),
        ],
      },
    },
  },
  plugins: [
    {
      name: "vite-plugin-directory-index",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url) {
            const urlPath = req.url.split("?")[0];
            const fullPath = resolveDirPath(server.config.root, urlPath);
            if (
              fs.existsSync(fullPath) &&
              fs.statSync(fullPath).isDirectory()
            ) {
              const files = fs.readdirSync(fullPath);
              if (!files.includes("index.html")) {
                const isJson =
                  req.url.includes("?json") ||
                  req.headers.accept?.includes("application/json");
                const fileData = files.map((file) => {
                  const filePath = path.join(fullPath, file);
                  const stat = fs.statSync(filePath);
                  const isDir = stat.isDirectory();
                  const href = urlPath.endsWith("/")
                    ? `${urlPath}${file}`
                    : `${urlPath}/${file}`;
                  return {
                    name: file,
                    isDir,
                    href,
                    mtime: stat.mtimeMs,
                    size: stat.size,
                  };
                });

                if (isJson) {
                  res.setHeader(
                    "Content-Type",
                    "application/json; charset=utf-8",
                  );
                  res.end(JSON.stringify(fileData, null, 2));
                  return;
                }

                const links = fileData.map(
                  (f) =>
                    `<li><a href="${f.href}">${f.name}${f.isDir ? "/" : ""}</a></li>`,
                );
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                res.end(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Index of ${urlPath}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; }
    ul { list-style: none; padding: 0; }
    li { margin: 0.5rem 0; }
    a { text-decoration: none; color: #0366d6; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Index of ${urlPath}</h1>
  <ul>
    ${urlPath !== "/" ? `<li><a href="../">../</a></li>` : ""}
    ${links.join("\\n")}
  </ul>
</body>
</html>`);
                return;
              }
            }
          }
          next();
        });
      },
    },
  ],
});
