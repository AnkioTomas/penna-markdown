import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createTransformer } from "@/transformer/index.js";

const allCases = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../fixtures/gfm/cases.json"), "utf8"),
);

const ENTITY_CASES = allCases.filter((c) => c.id >= 321 && c.id <= 337);

describe("GFM Entity references #321-337", () => {
  const transformer = createTransformer();

  for (const c of ENTITY_CASES) {
    it(`example ${c.id}`, () => {
      const { html } = transformer.render(c.markdown);
      expect(html).toBe(c.html);
    });
  }
});
