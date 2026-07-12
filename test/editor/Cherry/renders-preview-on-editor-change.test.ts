/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { Cherry } from "@/editor/Cherry";
import { createCherry } from "./helpers";

it("renders preview from initial editor.value without manual emit", async () => {
  document.body.innerHTML = '<div id="cherry-editor"></div>';
  const cherry = createCherry({
    editor: { value: "# Title\n\nHello" },
  });

  await Promise.resolve();

  const preview = document.querySelector(".cherry-preview")!;
  expect(preview.innerHTML.length).toBeGreaterThan(0);
  expect(preview.textContent).toContain("Title");

  cherry.destroy();
});

it("fills sidebar TOC after initial editor.value paint", async () => {
  document.body.innerHTML = '<div id="cherry-editor"></div>';
  const cherry = new Cherry(document.getElementById("cherry-editor")!, {
    editor: { value: "# Alpha\n\n## Beta" },
  });

  await Promise.resolve();

  const toc = document.querySelector(".cherry-sidebar-toc")!;
  expect(toc.textContent).toContain("Alpha");
  expect(toc.textContent).toContain("Beta");

  cherry.destroy();
});
