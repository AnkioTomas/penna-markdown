import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("renders {click} as checkbox spoiler", () => {
  const html = renderMarkdown(createEngine(), "!! 点击显示 !! {click}\n");
  expect(html).toBe(
    '<p><label class="cherry-spoiler click"><input type="checkbox" class="cherry-spoiler__toggle" hidden><span class="cherry-spoiler__text"> 点击显示 </span></label></p>\n',
  );
});
