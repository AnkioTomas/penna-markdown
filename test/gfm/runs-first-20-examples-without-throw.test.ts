import { expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

const FIXTURES = resolve(import.meta.dirname, "../fixtures/gfm");

async function loadCases() {
  const raw = await readFile(resolve(FIXTURES, "cases.json"), "utf8");
  return JSON.parse(raw);
}

it("runs first 20 examples without throw", async () => {
  const transformer = createEngine();
  const cases = await loadCases();
  for (const c of cases.slice(0, 20)) {
    const html = renderMarkdown(transformer, c.markdown);
    expect(typeof html).toBe("string");
  }
});
