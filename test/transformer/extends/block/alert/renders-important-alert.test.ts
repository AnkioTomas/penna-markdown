import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("renders important alert", () => {
  const engine = createEngine();
  const md =
    "> [!IMPORTANT]\n> Key information users need to know to achieve their goal.\n";
  expect(renderMarkdown(engine, md)).toBe(
    `<div class="penna-alert penna-alert--important">\n<p class="penna-alert__title">Important</p>\n<p>Key information users need to know to achieve their goal.</p>\n</div>\n`,
  );
});
