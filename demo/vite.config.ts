import { defineConfig, type Plugin } from "vite";
import fs from "fs";
import path from "path";

const rootDir = path.resolve(__dirname, "..");
const outDir = path.resolve(rootDir, "dist-demo");
const LISTING_FILE = "__listing__.json";

type DirEntry = {
  name: string;
  isDir: boolean;
  href: string;
  mtime: number;
  size: number;
};

function listDirEntries(dirPath: string, urlPath: string): DirEntry[] {
  const base = urlPath.endsWith("/") ? urlPath : `${urlPath}/`;
  return fs
    .readdirSync(dirPath)
    .filter((name) => name !== LISTING_FILE)
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

function collectHtmlInputs(
  dir: string,
  acc: Record<string, string> = {},
): Record<string, string> {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      collectHtmlInputs(full, acc);
      continue;
    }
    if (!name.endsWith(".html")) continue;
    const rel = path.relative(rootDir, full).replace(/\\/g, "/");
    const key = rel.replace(/\.html$/, "").replace(/\//g, "-");
    acc[key] = full;
  }
  return acc;
}

function writeDirListings(srcDir: string, destDir: string, urlPath: string) {
  fs.mkdirSync(destDir, { recursive: true });
  const entries = listDirEntries(srcDir, urlPath);
  fs.writeFileSync(
    path.join(destDir, LISTING_FILE),
    JSON.stringify(entries),
    "utf8",
  );

  for (const entry of entries) {
    if (!entry.isDir) continue;
    writeDirListings(
      path.join(srcDir, entry.name),
      path.join(destDir, entry.name),
      entry.href.endsWith("/") ? entry.href : `${entry.href}/`,
    );
  }
}

function copyDemoStaticAssets(): Plugin {
  return {
    name: "copy-demo-static-assets",
    closeBundle() {
      const docsSrc = path.join(rootDir, "docs");
      const docsDest = path.join(outDir, "docs");
      const logoSrc = path.join(rootDir, "logo");
      const logoDest = path.join(outDir, "logo");

      fs.cpSync(docsSrc, docsDest, { recursive: true });
      fs.cpSync(logoSrc, logoDest, { recursive: true });
      writeDirListings(docsSrc, docsDest, "/docs/");
    },
  };
}

function directoryIndexPlugin(): Plugin {
  return {
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
  };
}

const htmlInputs = {
  index: path.join(rootDir, "index.html"),
  ...collectHtmlInputs(path.join(rootDir, "demo")),
};

export default defineConfig(({ command }) => ({
  root: rootDir,
  // 生产用相对路径，避免挂在子目录 / FastAPI StaticFiles 时 /assets /demo 404
  base: command === "build" ? "./" : "/",
  server: {
    port: 5173,
    open: "/demo/index.html",
    fs: {
      allow: [rootDir],
    },
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir,
    emptyOutDir: true,
    target: "es2022",
    rollupOptions: {
      input: htmlInputs,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  plugins: [directoryIndexPlugin(), copyDemoStaticAssets()],
}));
