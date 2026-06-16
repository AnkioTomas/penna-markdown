import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const gfmCases = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../fixtures/gfm/cases.json"), "utf8"),
);

function gfmCase(id) {
  const c = gfmCases.find((x) => x.id === id);
  if (!c) throw new Error(`GFM case ${id} not found`);
  return c;
}

describe("block/html-block", () => {
  const transformer = createEngine();

  it.each([145, 146])("example %i", (id) => {
    const c = gfmCase(id);
    const html = renderMarkdown(transformer, c.markdown);
    expect(html).toBe(c.html);
  });

  it("Example 137: blank lines inside del allow markdown between tags", () => {
    const c = gfmCase(137);
    const html = renderMarkdown(transformer, c.markdown);
    expect(html).toBe(c.html);
  });
});
