import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "./helpers/engine.js";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseGfmSpec } from "../scripts/fetch-gfm-spec.js";

const FIXTURES = resolve(import.meta.dirname, "fixtures/gfm");

async function loadCases() {
  const raw = await readFile(resolve(FIXTURES, "cases.json"), "utf8");
  return JSON.parse(raw);
}

describe("GFM official spec fixtures", () => {
  it("fixtures exist and match spec.txt when present", async () => {
    const cases = await loadCases();
    expect(cases.length).toBeGreaterThan(600);
    expect(cases[0]).toMatchObject({
      id: 1,
      markdown: expect.any(String),
      html: expect.any(String),
      section: expect.any(String),
    });
  });

  it("parser extracts same count from bundled spec.txt", async () => {
    const spec = await readFile(resolve(FIXTURES, "spec.txt"), "utf8");
    const parsed = parseGfmSpec(spec);
    const cases = await loadCases();
    expect(parsed.length).toBe(cases.length);
  });
});

describe("GFM conformance (optional smoke)", () => {
  const transformer = createEngine();

  it("runs first 20 examples without throw", async () => {
    const cases = await loadCases();
    for (const c of cases.slice(0, 20)) {
      const html = renderMarkdown(transformer, c.markdown);
      expect(typeof html).toBe("string");
    }
  });
});
