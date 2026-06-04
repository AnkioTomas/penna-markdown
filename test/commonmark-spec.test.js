import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createTransformer } from "../src/transformer/index.js";
import { parseCommonMarkSpec } from "../scripts/fetch-commonmark-spec.js";

const FIXTURES = resolve(import.meta.dirname, "fixtures/commonmark");

async function loadCases() {
  const raw = await readFile(resolve(FIXTURES, "cases.json"), "utf8");
  return JSON.parse(raw);
}

describe("CommonMark official spec fixtures", () => {
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
    const parsed = parseCommonMarkSpec(spec);
    const cases = await loadCases();
    expect(parsed.length).toBe(cases.length);
  });
});

describe("CommonMark conformance (optional smoke)", () => {
  const transformer = createTransformer();

  it("runs first 20 examples without throw", async () => {
    const cases = await loadCases();
    for (const c of cases.slice(0, 20)) {
      const { html } = transformer.render(c.markdown);
      expect(typeof html).toBe("string");
    }
  });
});
