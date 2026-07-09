import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("renders warning alert", () => {
  const engine = createEngine();
  const md =
    "> [!WARNING]\n> Urgent info that needs immediate user attention to avoid problems.\n";
  expect(renderMarkdown(engine, md)).toBe(
    `<div class="cherry-alert cherry-alert--warning">\n<p class="cherry-alert__title">Warning</p>\n<p>Urgent info that needs immediate user attention to avoid problems.</p>\n</div>\n`,
  );
});
