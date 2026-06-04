#!/usr/bin/env node
/**
 * 从 commonmark/commonmark-spec 拉取官方 spec.txt，解析为 JSON 测试用例。
 *
 * 用法：
 *   node scripts/fetch-commonmark-spec.js
 *   node scripts/fetch-commonmark-spec.js --ref 0.31.2
 *   node scripts/fetch-commonmark-spec.js --spec ./test/fixtures/commonmark/spec.txt
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = resolve(ROOT, "test/fixtures/commonmark");
const FENCE = "`".repeat(32);
const DEFAULT_REF = "master";
const SPEC_URL =
  "https://raw.githubusercontent.com/commonmark/commonmark-spec/{ref}/spec.txt";

function parseArgs(argv) {
  const opts = { ref: DEFAULT_REF, spec: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--ref" && argv[i + 1]) {
      opts.ref = argv[++i];
    } else if (arg === "--spec" && argv[i + 1]) {
      opts.spec = resolve(process.cwd(), argv[++i]);
    } else if (arg === "-h" || arg === "--help") {
      console.log(`用法: node scripts/fetch-commonmark-spec.js [选项]

选项:
  --ref <git-ref>   commonmark-spec 分支或标签，默认 master
  --spec <path>     不下载，直接解析本地 spec.txt
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
    headers: { "User-Agent": "cherry-markdown-next/fetch-commonmark-spec" },
  });
  if (!res.ok) {
    throw new Error(`下载失败 HTTP ${res.status}: ${url}`);
  }
  return res.text();
}

/**
 * 解析 CommonMark spec.txt（与 spec_tests.py 的 get_tests 兼容）。
 * @param {string} specText
 */
export function parseCommonMarkSpec(specText) {
  const lines = specText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const headerRe = /^#+ /;

  let lineNumber = 0;
  let startLine = 0;
  let endLine = 0;
  let exampleNumber = 0;
  let markdownLines = [];
  let htmlLines = [];
  let state = 0;
  let section = "";
  const tests = [];

  for (const line of lines) {
    lineNumber += 1;
    const trimmed = line.trim();

    if (trimmed.startsWith(`${FENCE} example`)) {
      state = 1;
    } else if (trimmed === FENCE) {
      state = 0;
      exampleNumber += 1;
      endLine = lineNumber;
      tests.push({
        id: exampleNumber,
        example: exampleNumber,
        markdown: markdownLines.join("").replace(/→/g, "\t"),
        html: htmlLines.join("").replace(/→/g, "\t"),
        start_line: startLine,
        end_line: endLine,
        section,
      });
      startLine = 0;
      markdownLines = [];
      htmlLines = [];
    } else if (trimmed === ".") {
      state = 2;
    } else if (state === 1) {
      if (startLine === 0) startLine = lineNumber - 1;
      markdownLines.push(`${line}\n`);
    } else if (state === 2) {
      htmlLines.push(`${line}\n`);
    } else if (state === 0 && headerRe.test(line)) {
      section = line.replace(headerRe, "").trim();
    }
  }

  return tests;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  await mkdir(OUT_DIR, { recursive: true });

  let specText;
  let source;
  if (opts.spec) {
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
    console.log("已保存: test/fixtures/commonmark/spec.txt");
  }

  const cases = parseCommonMarkSpec(specText);
  const meta = {
    source,
    fetched_at: new Date().toISOString(),
    spec_url: "https://spec.commonmark.org/",
    repository: "https://github.com/commonmark/commonmark-spec",
    total: cases.length,
    sections: [...new Set(cases.map((c) => c.section))].length,
  };

  await writeFile(resolve(OUT_DIR, "cases.json"), `${JSON.stringify(cases, null, 2)}\n`, "utf8");
  await writeFile(resolve(OUT_DIR, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`, "utf8");

  console.log(`已保存: test/fixtures/commonmark/cases.json (${cases.length} 条用例)`);
  console.log("已保存: test/fixtures/commonmark/meta.json");
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
