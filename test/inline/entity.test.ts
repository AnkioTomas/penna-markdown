import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const allCases = JSON.parse(
  readFileSync(
    resolve(import.meta.dirname, "../fixtures/gfm/cases.json"),
    "utf8",
  ),
);

const ENTITY_CASES = allCases.filter((c) => c.id >= 321 && c.id <= 337);

describe("GFM Entity references #321-337", () => {
  const transformer = createEngine();

  for (const c of ENTITY_CASES) {
    it(`example ${c.id}`, () => {
      const html = renderMarkdown(transformer, c.markdown);
      expect(html).toBe(c.html);
    });
  }
});
