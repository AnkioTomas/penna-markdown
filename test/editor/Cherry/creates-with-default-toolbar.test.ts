/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { Cherry } from "@/editor/Cherry";

it("creates with default toolbar when toolbar option is omitted", () => {
  document.body.innerHTML = '<div id="cherry-editor"></div>';
  const cherry = new Cherry(document.getElementById("cherry-editor")!, {
    editor: { value: "# Hello" },
  });

  expect(document.querySelector(".cherry-toolbar")).toBeTruthy();
  expect(cherry.getMarkdown()).toBe("# Hello");

  cherry.destroy();
});
