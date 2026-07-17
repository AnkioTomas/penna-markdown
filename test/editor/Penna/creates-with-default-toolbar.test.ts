/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { Penna } from "@/editor/Penna";

it("creates with default toolbar when toolbar option is omitted", () => {
  document.body.innerHTML = '<div id="penna-editor"></div>';
  const penna = new Penna(document.getElementById("penna-editor")!, {
    editor: { value: "# Hello" },
  });

  expect(document.querySelector(".penna-toolbar")).toBeTruthy();
  expect(penna.getMarkdown()).toBe("# Hello");

  penna.destroy();
});
