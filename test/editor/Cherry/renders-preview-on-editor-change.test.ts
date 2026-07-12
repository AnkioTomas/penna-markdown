/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { createCherry } from "./helpers";

it("renders preview on editor:change", () => {
  document.body.innerHTML = '<div id="cherry-editor"></div>';
  const cherry = createCherry({
    editor: { value: "# Title" },
  });

  cherry.eventBus.emit("editor:change", { markdown: cherry.getMarkdown() });

  const preview = document.querySelector(".cherry-preview")!;
  expect(preview.innerHTML.length).toBeGreaterThan(0);

  cherry.destroy();
});
