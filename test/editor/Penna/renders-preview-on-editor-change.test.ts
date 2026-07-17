/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { Penna } from "@/editor/Penna";
import { createPenna } from "./helpers";

it("renders preview from initial editor.value without manual emit", async () => {
  document.body.innerHTML = '<div id="penna-editor"></div>';
  const penna = createPenna({
    editor: { value: "# Title\n\nHello" },
  });

  await Promise.resolve();

  const preview = document.querySelector(".penna-preview")!;
  expect(preview.innerHTML.length).toBeGreaterThan(0);
  expect(preview.textContent).toContain("Title");

  penna.destroy();
});

it("fills sidebar TOC after initial editor.value paint", async () => {
  document.body.innerHTML = '<div id="penna-editor"></div>';
  const penna = new Penna(document.getElementById("penna-editor")!, {
    editor: { value: "# Alpha\n\n## Beta" },
  });

  await Promise.resolve();

  const toc = document.querySelector(".penna-sidebar-toc")!;
  expect(toc.textContent).toContain("Alpha");
  expect(toc.textContent).toContain("Beta");

  penna.destroy();
});
