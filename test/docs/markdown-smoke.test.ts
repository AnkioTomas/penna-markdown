import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createEnhancedEngine, renderMarkdown } from "../helpers/engine.js";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

type Sample = { id: string; markdown: string };

const TIMELINE_WITH_ITEM_RE = /::: timeline\b[\s\S]*?^- \[([^\]]+)\]\s+\S/m;
const ILLEGAL_FIELD_DIRECTIVE_RE = /^[ \t]*@(?:param|returns|readonly)\b/m;
const FIELD_NAME_WITH_SPACE_RE = /^[ \t]*::: field \S*[ \t]+\S+/m;

function loadDocsSamples(): Sample[] {
  const docsDir = join(rootDir, "docs");
  return readdirSync(docsDir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => ({
      id: `docs/${name}`,
      markdown: readFileSync(join(docsDir, name), "utf8"),
    }));
}

/** 从 demo data.ts 的 `id` + `markdown` 字段抽出样例（避免 tsc 禁止 .ts 扩展导入）。 */
function loadSyntaxDataFile(relPath: string, prefix: string): Sample[] {
  const source = readFileSync(join(rootDir, relPath), "utf8");
  const samples: Sample[] = [];
  const itemRe =
    /\{\s*id:\s*"([^"]+)"\s*,\s*name:\s*(?:"[^"]*"|`[^`]*`)\s*,\s*markdown:\s*`([\s\S]*?)`\s*,?\s*\}/g;
  let match: RegExpExecArray | null;
  while ((match = itemRe.exec(source))) {
    samples.push({ id: `${prefix}/${match[1]}`, markdown: match[2] });
  }
  if (samples.length === 0) {
    throw new Error(`no syntax samples extracted from ${relPath}`);
  }
  return samples;
}

function extractEditorEmbedded(): Sample[] {
  const source = readFileSync(
    join(rootDir, "demo/modules/editor/main.ts"),
    "utf8",
  );
  const names = ["OPTIONS_GUIDE", "AI_DEMO", "CUSTOM_SYNTAX_DEMO"] as const;
  const samples: Sample[] = [];
  for (const name of names) {
    const re = new RegExp(`const ${name} = \`([\\s\\S]*?)\`;\\n`);
    const match = source.match(re);
    if (!match) {
      throw new Error(`failed to extract ${name} from editor main.ts`);
    }
    samples.push({ id: `demo/editor/${name}`, markdown: match[1] });
  }
  return samples;
}

function allSamples(): Sample[] {
  return [
    ...loadDocsSamples(),
    ...loadSyntaxDataFile("demo/syntax/extends/data.ts", "demo/extends"),
    ...loadSyntaxDataFile("demo/syntax/gfm/data.ts", "demo/gfm"),
    ...extractEditorEmbedded(),
  ];
}

function stripFencedCode(markdown: string): string {
  return markdown
    .replace(/^ {0,3}(`{3,}|~{3,}).*?\n[\s\S]*?^\s*\1\s*$/gm, "")
    .replace(/```[\s\S]*?```/g, "");
}

function scanFieldIssues(markdown: string): string[] {
  const body = stripFencedCode(markdown);
  const issues: string[] = [];
  if (ILLEGAL_FIELD_DIRECTIVE_RE.test(body)) {
    issues.push("illegal field directive (@param/@returns/@readonly)");
  }
  if (FIELD_NAME_WITH_SPACE_RE.test(body)) {
    issues.push("field name contains whitespace (breaks ::: field parser)");
  }
  return issues;
}

describe("docs/demo markdown smoke", () => {
  const samples = allSamples();

  it("collects docs, syntax demos, and editor embedded samples", () => {
    expect(samples.length).toBeGreaterThan(20);
    expect(samples.some((s) => s.id.startsWith("docs/"))).toBe(true);
    expect(samples.some((s) => s.id === "demo/extends/timeline")).toBe(true);
  });

  it.each(samples.map((s) => [s.id, s] as const))(
    "parses and renders %s",
    (_id, sample) => {
      const engine = createEnhancedEngine();
      let html = "";
      expect(() => {
        html = renderMarkdown(engine, sample.markdown);
      }).not.toThrow();
      expect(typeof html).toBe("string");

      const liveMarkdown = stripFencedCode(sample.markdown);
      if (TIMELINE_WITH_ITEM_RE.test(liveMarkdown)) {
        expect(html).toContain("penna-timeline");
        expect(html).toContain("penna-timeline-time");
      }

      expect(scanFieldIssues(sample.markdown)).toEqual([]);
    },
  );
});
