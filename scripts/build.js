/**
 * 构建脚本：
 * - transformer：现代 ESM、传统 IIFE、CJS，及对应 min 产物 + transformer.css
 * - renderer / editor：ESM、CJS、IIFE（开发态，含 sourcemap）
 */

import * as esbuild from "esbuild";
import * as sass from "sass";
import { rmSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(rootDir, "dist");
const styleEntry = resolve(rootDir, "style/style.scss");
const transformerDir = resolve(rootDir, "src/transformer");

const alias = {
  "@": resolve(rootDir, "src"),
};

/** @type {import('esbuild').BuildOptions} */
const base = {
  bundle: true,
  platform: "browser",
  alias,
};

/** transformer 入口 */
const transformerEntry = {
  in: "src/transformer/index.js",
  name: "transformer",
  globalName: "CherryNextTransformer",
};

/** 其余子系统入口 */
const simpleEntries = [
  { in: "src/renderer/index.js", name: "renderer", globalName: "CherryNextRenderer" },
  { in: "src/editor/index.js", name: "editor", globalName: "CherryNextEditor" },
];

/**
 * @param {string} entryPath
 * @param {import('esbuild').BuildOptions} options
 */
async function buildOne(entryPath, options) {
  await esbuild.build({
    ...base,
    entryPoints: [entryPath],
    ...options,
  });
}

/**
 * @param {{ in: string, name: string, globalName: string }} entry
 */
async function buildTransformerEntry(entry) {
  const entryPath = resolve(rootDir, entry.in);
  const out = (file) => resolve(distDir, file);

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

function compileTransformerStyles() {
  const loadPaths = [transformerDir, resolve(transformerDir, "gfm"), resolve(transformerDir, "extends")];

  const expanded = sass.compile(styleEntry, {
    loadPaths,
    style: "expanded",
    sourceMap: true,
  });
  writeFileSync(resolve(distDir, "transformer.css"), expanded.css);
  writeFileSync(resolve(rootDir, "style/style.css"), expanded.css);
  if (expanded.sourceMap) {
    writeFileSync(
      resolve(distDir, "transformer.css.map"),
      JSON.stringify(expanded.sourceMap),
    );
  }

  const compressed = sass.compile(styleEntry, {
    loadPaths,
    style: "compressed",
  });
  writeFileSync(resolve(distDir, "transformer.min.css"), compressed.css);
}

/**
 * @param {{ in: string, name: string, globalName: string }} entry
 */
async function buildSimpleEntry(entry) {
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
  compileTransformerStyles();
  console.log("styles done: transformer.css / transformer.min.css / style/style.css");
} else {
  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true });
  compileTransformerStyles();
  await buildTransformerEntry(transformerEntry);

  for (const entry of simpleEntries) {
    await buildSimpleEntry(entry);
  }

  const built = [transformerEntry.name, ...simpleEntries.map((e) => e.name)].join(", ");
  console.log("build done:", built);
  console.log("transformer outputs: js bundles + transformer.css / transformer.min.css");
}
