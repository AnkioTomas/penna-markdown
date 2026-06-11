/**
 * 构建脚本：
 * - transformer / transformer.extends：现代 ESM、传统 IIFE、CJS，及对应 min 产物 + extends 样式
 * - renderer / editor：ESM、CJS、IIFE（开发态，含 sourcemap）
 */

import * as esbuild from "esbuild";
import * as sass from "sass";
import { rmSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(rootDir, "dist");

const alias = {
  "@": resolve(rootDir, "src"),
};

/** @type {import('esbuild').BuildOptions} */
const base = {
  bundle: true,
  platform: "browser",
  alias,
};

/** transformer 系列入口 */
const transformerEntries = [
  { in: "src/transformer/index.js", name: "transformer", globalName: "CherryNextTransformer" },
  {
    in: "src/transformer/extends/extends.js",
    name: "transformer.extends",
    globalName: "CherryNextTransformerExtends",
    style: "src/transformer/extends/style.scss",
  },
];

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
 * transformer 多架构产物：
 * - 现代：ESM（es2020）
 * - 传统：IIFE（es5，script 标签）
 * - Node：CJS（es2020）
 * 每种格式均输出开发版（含 sourcemap）与 min 版。
 *
 * @param {{ in: string, name: string, globalName: string, style?: string }} entry
 */
async function buildTransformerEntry(entry) {
  const entryPath = resolve(rootDir, entry.in);
  const out = (file) => resolve(distDir, file);

  const modernTarget = ["es2020"];
  // esbuild 无法将 bundled 依赖降到 es5，传统产物用 IIFE + es2015 覆盖 script 直引场景
  const traditionalTarget = ["es2015"];

  // 现代架构 — ESM
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

  // Node — CJS
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

  // 传统架构 — IIFE（<script> 直引）
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

  if (entry.style) {
    compileTransformerStyles(entry.name, entry.style);
  }
}

/**
 * 编译 extends SCSS 为 dist 下的 CSS（常量和 min 两份）。
 *
 * @param {string} name
 * @param {string} styleEntry
 */
function compileTransformerStyles(name, styleEntry) {
  const input = resolve(rootDir, styleEntry);
  const loadPaths = [resolve(rootDir, dirname(styleEntry))];

  const expanded = sass.compile(input, {
    loadPaths,
    style: "expanded",
    sourceMap: true,
  });
  writeFileSync(resolve(distDir, `${name}.css`), expanded.css);
  if (expanded.sourceMap) {
    writeFileSync(
      resolve(distDir, `${name}.css.map`),
      JSON.stringify(expanded.sourceMap),
    );
  }

  const compressed = sass.compile(input, {
    loadPaths,
    style: "compressed",
  });
  writeFileSync(resolve(distDir, `${name}.min.css`), compressed.css);
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

mkdirSync(distDir, { recursive: true });
rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

for (const entry of transformerEntries) {
  await buildTransformerEntry(entry);
}

for (const entry of simpleEntries) {
  await buildSimpleEntry(entry);
}

const built = [
  ...transformerEntries.map((e) => e.name),
  ...simpleEntries.map((e) => e.name),
].join(", ");
console.log("build done:", built);
console.log(
  "transformer outputs: modern (.mjs/.min.mjs), traditional (.iife.js/.min.js), cjs, extends css",
);
