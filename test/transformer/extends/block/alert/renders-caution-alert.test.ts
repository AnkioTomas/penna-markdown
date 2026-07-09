import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("renders caution alert", () => {
  const engine = createEngine();
  const md =
    "> [!CAUTION]\n> Advises about risks or negative outcomes of certain actions.\n";
  expect(renderMarkdown(engine, md)).toBe(
    `<div class="cherry-alert cherry-alert--caution">\n<p class="cherry-alert__title">Caution</p>\n<p>Advises about risks or negative outcomes of certain actions.</p>\n</div>\n`,
  );
});
