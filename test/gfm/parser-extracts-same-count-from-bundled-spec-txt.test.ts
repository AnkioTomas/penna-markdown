import { expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseGfmSpec } from "../../scripts/fetch-gfm-spec.js";

const FIXTURES = resolve(import.meta.dirname, "../fixtures/gfm");

async function loadCases() {
  const raw = await readFile(resolve(FIXTURES, "cases.json"), "utf8");
  return JSON.parse(raw);
}

it("parser extracts same count from bundled spec.txt", async () => {
  const spec = await readFile(resolve(FIXTURES, "spec.txt"), "utf8");
  const parsed = parseGfmSpec(spec);
  const cases = await loadCases();
  expect(parsed.length).toBe(cases.length);
});
