import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const gfmCases = JSON.parse(
  readFileSync(
    resolve(import.meta.dirname, "../../../../fixtures/gfm/cases.json"),
    "utf8",
  ),
);

function gfmCase(id: number) {
  const c = gfmCases.find((x: { id: number }) => x.id === id);
  if (!c) throw new Error(`GFM case ${id} not found`);
  return c;
}

it("example 201", () => {
  const engine = createEngine();
  const c = gfmCase(201);
  expect(renderMarkdown(engine, c.markdown)).toBe(c.html);
});
