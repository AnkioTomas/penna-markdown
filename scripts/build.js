/**
 * 构建脚本：将 transformer / renderer / editor 分别打包为 ESM、CJS、IIFE。
 */

import * as esbuild from "esbuild";
import { rmSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const shared = {
  bundle: true,
  platform: "browser",
  target: ["es2018"],
  sourcemap: true,
  alias: {
    "@": resolve(rootDir, "src"),
  },
};

/** 三个子系统入口与全局变量名（IIFE） */
const entries = [
  { in: "src/transformer/index.js", name: "transformer", globalName: "CherryNextTransformer" },
  { in: "src/transformer/extends/extends.js", name: "transformer.extends", globalName: "CherryNextTransformerExtends" },
  { in: "src/renderer/index.js", name: "renderer", globalName: "CherryNextRenderer" },
  { in: "src/editor/index.js", name: "editor", globalName: "CherryNextEditor" },
];

mkdirSync(resolve(rootDir, "dist"), { recursive: true });
rmSync(resolve(rootDir, "dist"), { recursive: true, force: true });
mkdirSync(resolve(rootDir, "dist"), { recursive: true });

for (const entry of entries) {
  const entryPath = resolve(rootDir, entry.in);

  await esbuild.build({
    ...shared,
    entryPoints: [entryPath],
    outfile: resolve(rootDir, `dist/${entry.name}.mjs`),
    format: "esm",
  });

  await esbuild.build({
    ...shared,
    entryPoints: [entryPath],
    outfile: resolve(rootDir, `dist/${entry.name}.cjs`),
    format: "cjs",
  });

  await esbuild.build({
    ...shared,
    entryPoints: [entryPath],
    outfile: resolve(rootDir, `dist/${entry.name}.iife.js`),
    format: "iife",
    globalName: entry.globalName,
  });
}

console.log("build done:", entries.map((e) => e.name).join(", "));
