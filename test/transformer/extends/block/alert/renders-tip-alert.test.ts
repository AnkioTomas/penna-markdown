import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("renders tip alert", () => {
  const engine = createEngine();
  const md =
    "> [!TIP]\n> Helpful advice for doing things better or more easily.\n";
  expect(renderMarkdown(engine, md)).toBe(
    `<div class="penna-alert penna-alert--tip">\n<p class="penna-alert__title">Tip</p>\n<p>Helpful advice for doing things better or more easily.</p>\n</div>\n`,
  );
});
