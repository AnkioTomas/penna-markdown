import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("renders note alert", () => {
  const engine = createEngine();
  const md =
    "> [!NOTE]\n> Useful information that users should know, even when skimming content.\n";
  expect(renderMarkdown(engine, md)).toBe(
    `<div class="penna-alert penna-alert--note">\n<p class="penna-alert__title">Note</p>\n<p>Useful information that users should know, even when skimming content.</p>\n</div>\n`,
  );
});
