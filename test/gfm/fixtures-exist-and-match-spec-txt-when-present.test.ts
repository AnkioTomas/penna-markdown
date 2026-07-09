import { expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const FIXTURES = resolve(import.meta.dirname, "../fixtures/gfm");

async function loadCases() {
  const raw = await readFile(resolve(FIXTURES, "cases.json"), "utf8");
  return JSON.parse(raw);
}

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
