/**
 * 一次性迁移：将 src/、test/、demo/、scripts/ 下的 .js 重命名为 .ts
 * （跳过已存在的 .ts、以及 demo 内仅作静态资源的 .js）
 */

import { readdirSync, renameSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const roots = [
  resolve(rootDir, "src"),
  resolve(rootDir, "test"),
  resolve(rootDir, "demo"),
  resolve(rootDir, "scripts"),
];

/** @param {string} dir */
function walk(dir) {
  /** @type {string[]} */
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

let renamed = 0;
for (const root of roots) {
  for (const file of walk(root)) {
    if (extname(file) !== ".js") continue;
    const tsPath = file.replace(/\.js$/, ".ts");
    renameSync(file, tsPath);
    renamed += 1;
    console.log(`${file} -> ${tsPath}`);
  }
}

console.log(`\nRenamed ${renamed} files.`);
