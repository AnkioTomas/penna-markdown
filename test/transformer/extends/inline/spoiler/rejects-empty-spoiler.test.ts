import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("rejects empty spoiler", () => {
  const html = renderMarkdown(createEngine(), "!!  !!\n");
  expect(html).toBe('<p><span class="cherry-spoiler">  </span></p>\n');
});
