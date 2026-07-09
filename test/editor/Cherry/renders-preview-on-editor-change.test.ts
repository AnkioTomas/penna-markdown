/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { Cherry } from "@/editor/Cherry";

function createCherry(options: Parameters<typeof Cherry>[1] = {}) {
  const mount = document.getElementById("cherry-editor")!;
  return new Cherry(mount, options);
}

it("renders preview on editor:change", () => {
  document.body.innerHTML = '<div id="cherry-editor"></div>';
  const cherry = createCherry({
    editor: { value: "# Title" },
  });

  const preview = document.querySelector(".cherry-preview")!;
  expect(preview.innerHTML.length).toBeGreaterThan(0);

  cherry.destroy();
});
