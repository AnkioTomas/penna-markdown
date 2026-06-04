import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createTransformer } from "../../src/transformer/index.js";

const cases = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../fixtures/gfm/cases.json"), "utf8"),
).filter((c) => c.id >= 602 && c.id <= 620);

describe("GFM Autolinks #602-620", () => {
  const transformer = createTransformer();

  for (const c of cases) {
    it(`example ${c.id}`, () => {
      const { html } = transformer.render(c.markdown);
      expect(html).toBe(c.html);
    });
  }
});
