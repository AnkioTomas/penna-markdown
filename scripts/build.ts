/**
 * 构建脚本：仅输出 min 产物
 * - cherry.min.*            完整编辑器（ESM / CJS / IIFE）
 * - cherry-render.min.*     渲染器（内含 Theme）
 * - cherry-transformer.min.* Markdown 解析引擎
 * - 主题样式：Vite 编译 SCSS → dist/cherry-*.min.css
 */
import * as esbuild from "esbuild";
import { mkdirSync, rmSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { build as viteBuild } from "vite";
import REGISTERED_THEMES from "../src/theme/ThemeRegister.js";
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(rootDir, "dist");
const themeViteConfig = resolve(rootDir, "scripts/vite.theme.config.ts");
const alias = {
  "@": resolve(rootDir, "src"),
};
const base: esbuild.BuildOptions = {
  bundle: true,
  platform: "browser",
  alias,
  minify: true,
  sourcemap: false,
  legalComments: "none",
};
type BundleEntry = {
  in: string;
  name: string;
  globalName: string;
  modernTarget?: string[];
  traditionalTarget?: string[];
};
const entries: BundleEntry[] = [
  {
    in: "src/editor/Cherry.ts",
    name: "cherry",
    globalName: "CherryNextEditor",
  },
  {
    in: "src/renderer/Renderer.ts",
    name: "cherry-render",
    globalName: "CherryNextRenderer",
  },
  {
    in: "src/transformer/TransformerEngine.ts",
    name: "cherry-transformer",
    globalName: "CherryNextTransformer",
    modernTarget: ["es2015"],
    traditionalTarget: ["es2015"],
  },
];
async function buildOne(entryPath: string, options: esbuild.BuildOptions) {
  await esbuild.build({
    ...base,
    entryPoints: [entryPath],
    logLevel: "warning",
    ...options,
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function buildBundleEntry(entry: BundleEntry) {
  const entryPath = resolve(rootDir, entry.in);
  const out = (file: string) => resolve(distDir, file);
  const modernTarget = entry.modernTarget ?? ["es2015"];
  const traditionalTarget = entry.traditionalTarget ?? modernTarget;
  const outputs = [
    {
      file: out(`${entry.name}.min.mjs`),
      format: "esm" as const,
      target: modernTarget,
    },
    {
      file: out(`${entry.name}.min.cjs`),
      format: "cjs" as const,
      target: modernTarget,
    },
    {
      file: out(`${entry.name}.min.js`),
      format: "iife" as const,
      target: traditionalTarget,
      globalName: entry.globalName,
    },
  ];

  console.log(`esbuild: ${entry.name}`);
  for (const output of outputs) {
    await buildOne(entryPath, {
      outfile: output.file,
      format: output.format,
      target: output.target,
      globalName: output.globalName,
      packages: output.format === "iife" ? undefined : "external",
    });
    const size = statSync(output.file).size;
    console.log(
      `  ${output.file.replace(`${distDir}/`, "")}  ${formatSize(size)}`,
    );
  }
}
async function buildThemeStyles() {
  await viteBuild({ configFile: themeViteConfig, logLevel: "info" });
}

function runOrThrow(command: string, args: string[], label: string) {
  console.log(`${label}: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit ${result.status ?? "null"}`);
  }
}

/** 生成可被消费者引用的 .d.ts（并把 @/ 别名改成相对路径） */
function buildDeclarations() {
  runOrThrow("pnpm", ["exec", "tsc", "-p", "tsconfig.dts.json"], "dts:tsc");
  runOrThrow(
    "pnpm",
    ["exec", "tsc-alias", "-p", "tsconfig.dts.json"],
    "dts:alias",
  );
}

const stylesOnly = process.argv.includes("--styles-only");
mkdirSync(distDir, { recursive: true });
if (stylesOnly) {
  console.log(
    "mode: styles-only (JS bundles skipped, use `pnpm build` for full build)",
  );
  await buildThemeStyles();
  console.log(`theme styles done: ${REGISTERED_THEMES.join(", ")}`);
} else {
  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true });
  console.log("mode: full (css + js + dts)");
  await buildThemeStyles();
  for (const entry of entries) {
    await buildBundleEntry(entry);
  }
  buildDeclarations();
  console.log("build done (min + dts):", entries.map((e) => e.name).join(", "));
}
