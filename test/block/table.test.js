import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createTransformer } from "@/transformer/index.js";

const allCases = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../fixtures/gfm/cases.json"), "utf8"),
);

const TABLE_CASES = allCases.filter((c) => c.id >= 198 && c.id <= 205);

describe("GFM Tables #198-205", () => {
  const transformer = createTransformer();

  for (const c of TABLE_CASES) {
    it(`example ${c.id}`, () => {
      const { html } = transformer.render(c.markdown);
      expect(html).toBe(c.html);
    });
  }
});
