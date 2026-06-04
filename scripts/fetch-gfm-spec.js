#!/usr/bin/env node
/**
 * 从 github/cmark-gfm 拉取 GFM 官方 spec.txt，解析为 JSON 测试用例。
 *
 * 规范页 https://github.github.com/gfm/ 由该文件生成；
 * 用例格式与 test/spec_tests.py 中 get_tests() 一致。
 *
 * 用法：
 *   node scripts/fetch-gfm-spec.js
 *   node scripts/fetch-gfm-spec.js --ref 0.29.0.gfm
 *   node scripts/fetch-gfm-spec.js --spec ./test/GFM.md   # 仅解析本地文件
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = resolve(ROOT, "test/fixtures/gfm");
const FENCE = "`".repeat(32);
const DEFAULT_REF = "master";
const SPEC_URL =
  "https://raw.githubusercontent.com/github/cmark-gfm/{ref}/test/spec.txt";

function parseArgs(argv) {
  const opts = { ref: DEFAULT_REF, spec: null, split: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--ref" && argv[i + 1]) {
      opts.ref = argv[++i];
    } else if (arg === "--spec" && argv[i + 1]) {
      opts.spec = resolve(process.cwd(), argv[++i]);
    } else if (arg === "--split") {
      opts.split = true;
    } else if (arg === "-h" || arg === "--help") {
      console.log(`用法: node scripts/fetch-gfm-spec.js [选项]

选项:
  --ref <git-ref>   cmark-gfm 分支或标签，默认 master
  --spec <path>     不下载，直接解析本地 spec.txt / GFM.md
  --split           按 section 额外写出 cases/<section>.json
  -h, --help        显示帮助
`);
      process.exit(0);
    }
  }
  return opts;
}

async function downloadSpec(ref) {
  const url = SPEC_URL.replace("{ref}", ref);
  console.log(`下载: ${url}`);
  const res = await fetch(url, {
    headers: { "User-Agent": "cherry-markdown-next/fetch-gfm-spec" },
  });
  if (!res.ok) {
    throw new Error(`下载失败 HTTP ${res.status}: ${url}`);
  }
  return res.text();
}

/**
 * 解析 spec.txt（与 cmark-gfm test/spec_tests.py get_tests 相同）
 * @param {string} specText
 */
export function parseGfmSpec(specText) {
  const lines = specText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const headerRe = /^#+ /;

  let lineNumber = 0;
  let startLine = 0;
  let endLine = 0;
  let exampleNumber = 0;
  let markdownLines = [];
  let htmlLines = [];
  let state = 0;
  let extensions = [];
  let headertext = "";
  const tests = [];

  for (const line of lines) {
    lineNumber += 1;
    const trimmed = line.trim();

    if (trimmed.startsWith(`${FENCE} example`)) {
      state = 1;
      extensions = trimmed.slice(FENCE.length + " example".length).trim().split(/\s+/).filter(Boolean);
    } else if (trimmed === FENCE) {
      state = 0;
      exampleNumber += 1;
      endLine = lineNumber;
      if (!extensions.includes("disabled")) {
        tests.push({
          id: exampleNumber,
          example: exampleNumber,
          markdown: markdownLines.join("").replace(/→/g, "\t"),
          html: htmlLines.join("").replace(/→/g, "\t"),
          start_line: startLine,
          end_line: endLine,
          section: headertext,
          extensions: [...extensions],
        });
      }
      startLine = 0;
      markdownLines = [];
      htmlLines = [];
      extensions = [];
    } else if (trimmed === ".") {
      state = 2;
    } else if (state === 1) {
      if (startLine === 0) startLine = lineNumber - 1;
      markdownLines.push(`${line}\n`);
    } else if (state === 2) {
      htmlLines.push(`${line}\n`);
    } else if (state === 0 && headerRe.test(line)) {
      headertext = line.replace(headerRe, "").trim();
    }
  }

  return tests;
}

function slugSection(section) {
  return section
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled";
}

async function writeSplitCases(cases) {
  const byDir = resolve(OUT_DIR, "cases");
  await mkdir(byDir, { recursive: true });
  const groups = new Map();
  for (const item of cases) {
    const key = item.section || "Unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  for (const [section, items] of groups) {
    const file = resolve(byDir, `${slugSection(section)}.json`);
    await writeFile(file, `${JSON.stringify(items, null, 2)}\n`, "utf8");
  }
  return groups.size;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  await mkdir(OUT_DIR, { recursive: true });

  let specText;
  let source;

  if (opts.spec) {
    const { readFile } = await import("node:fs/promises");
    specText = await readFile(opts.spec, "utf8");
    source = { type: "local", path: opts.spec };
    console.log(`解析本地: ${opts.spec}`);
  } else {
    specText = await downloadSpec(opts.ref);
    source = {
      type: "remote",
      ref: opts.ref,
      url: SPEC_URL.replace("{ref}", opts.ref),
    };
    await writeFile(resolve(OUT_DIR, "spec.txt"), specText, "utf8");
    console.log(`已保存: test/fixtures/gfm/spec.txt`);
  }

  const cases = parseGfmSpec(specText);
  const disabled = specText.includes("disabled")
    ? cases.length
    : 0;

  const meta = {
    source,
    fetched_at: new Date().toISOString(),
    spec_url: "https://github.github.com/gfm/",
    repository: "https://github.com/github/cmark-gfm",
    total: cases.length,
    sections: [...new Set(cases.map((c) => c.section))].length,
  };

  await writeFile(resolve(OUT_DIR, "cases.json"), `${JSON.stringify(cases, null, 2)}\n`, "utf8");
  await writeFile(resolve(OUT_DIR, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`, "utf8");

  console.log(`已保存: test/fixtures/gfm/cases.json (${cases.length} 条用例)`);
  console.log(`已保存: test/fixtures/gfm/meta.json`);

  if (opts.split) {
    const n = await writeSplitCases(cases);
    console.log(`已按 section 拆分: test/fixtures/gfm/cases/ (${n} 个文件)`);
  }

  console.log(`完成。共 ${cases.length} 条有效用例，${meta.sections} 个章节。`);
}

const isCli =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
