/**
 * 构建脚本：
 * - transformer：现代 ESM、传统 IIFE、CJS，及对应 min 产物
 * - 主题样式：Vite 编译 SCSS → dist/*.min.css（editor / render 分主题输出）
 * - renderer / editor / theme：ESM、CJS、IIFE
 */

import * as esbuild from "esbuild";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build as viteBuild } from "vite";
import REGISTERED_THEMES from "../src/theme/ThemeRegister.js";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(rootDir, "dist");
const themeViteConfig = resolve(rootDir, "scripts/vite.theme.config.ts");

const alias = {
  "@": resolve(rootDir, "src"),
};

function cssRawPlugin(): esbuild.Plugin {
  return {
    name: "css-raw",
    setup(build) {
      build.onResolve({ filter: /\.css\?raw$/ }, (args) =>
        build
          .resolve(args.path.replace(/\?raw$/, ""), {
            resolveDir: args.resolveDir,
            kind: args.kind,
            importer: args.importer,
          })
          .then((resolved) =>
            resolved ? { path: resolved.path, namespace: "css-raw" } : null,
          ),
      );
      build.onLoad({ filter: /.*/, namespace: "css-raw" }, (args) => ({
        contents: readFileSync(args.path, "utf8"),
        loader: "text",
      }));
    },
  };
}

const base: esbuild.BuildOptions = {
  bundle: true,
  platform: "browser",
  alias,
  plugins: [cssRawPlugin()],
  loader: {
    ".css": "text",
  },
};

const transformerEntry = {
  in: "src/transformer/TransformerEngine.ts",
  name: "transformer",
  globalName: "CherryNextTransformer",
};

const simpleEntries = [
  { in: "src/renderer/Renderer.ts", name: "renderer", globalName: "CherryNextRenderer" },
  { in: "src/editor/Cherry.ts", name: "editor", globalName: "CherryNextEditor" },
  { in: "src/theme/Theme.ts", name: "theme", globalName: "CherryNextTheme" },
];

async function buildOne(entryPath: string, options: esbuild.BuildOptions) {
  await esbuild.build({
    ...base,
    entryPoints: [entryPath],
    ...options,
  });
}

async function buildTransformerEntry(entry: typeof transformerEntry) {
  const entryPath = resolve(rootDir, entry.in);
  const out = (file: string) => resolve(distDir, file);

  const modernTarget = ["es2020"];
  const traditionalTarget = ["es2015"];

  await buildOne(entryPath, {
    outfile: out(`${entry.name}.mjs`),
    format: "esm",
    target: modernTarget,
    sourcemap: true,
  });
  await buildOne(entryPath, {
    outfile: out(`${entry.name}.min.mjs`),
    format: "esm",
    target: modernTarget,
    minify: true,
    sourcemap: false,
    legalComments: "none",
  });

  await buildOne(entryPath, {
    outfile: out(`${entry.name}.cjs`),
    format: "cjs",
    target: modernTarget,
    sourcemap: true,
  });
  await buildOne(entryPath, {
    outfile: out(`${entry.name}.min.cjs`),
    format: "cjs",
    target: modernTarget,
    minify: true,
    sourcemap: false,
    legalComments: "none",
  });

  await buildOne(entryPath, {
    outfile: out(`${entry.name}.iife.js`),
    format: "iife",
    globalName: entry.globalName,
    target: traditionalTarget,
    sourcemap: true,
  });
  await buildOne(entryPath, {
    outfile: out(`${entry.name}.min.js`),
    format: "iife",
    globalName: entry.globalName,
    target: traditionalTarget,
    minify: true,
    sourcemap: false,
    legalComments: "none",
  });
}

async function buildThemeStyles() {
  await viteBuild({
    configFile: themeViteConfig,
    logLevel: "info",
  });
}

async function buildSimpleEntry(entry: (typeof simpleEntries)[number]) {
  const entryPath = resolve(rootDir, entry.in);
  const target = ["es2018"];

  await buildOne(entryPath, {
    outfile: resolve(distDir, `${entry.name}.mjs`),
    format: "esm",
    target,
    sourcemap: true,
  });
  await buildOne(entryPath, {
    outfile: resolve(distDir, `${entry.name}.cjs`),
    format: "cjs",
    target,
    sourcemap: true,
  });
  await buildOne(entryPath, {
    outfile: resolve(distDir, `${entry.name}.iife.js`),
    format: "iife",
    globalName: entry.globalName,
    target,
    sourcemap: true,
  });
}

const stylesOnly = process.argv.includes("--styles-only");

mkdirSync(distDir, { recursive: true });

if (stylesOnly) {
  await buildThemeStyles();
  console.log(`theme styles done: cherry + transformer + themes for ${REGISTERED_THEMES.join(", ")}`);
} else {
  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true });
  await buildThemeStyles();
  await buildTransformerEntry(transformerEntry);

  for (const entry of simpleEntries) {
    await buildSimpleEntry(entry);
  }

  const built = [transformerEntry.name, ...simpleEntries.map((e) => e.name)].join(", ");
  console.log("build done:", built);
  console.log(`theme css (min only): cherry + transformer + themes for ${REGISTERED_THEMES.join(", ")}`);
}
