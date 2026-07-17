/**
 * @vitest-environment jsdom
 */
import { expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { CodeListener } from "@/renderer/code/code.js";

it("delegates code collapse clicks", () => {
  const dom = new JSDOM(
    `<div id="preview">
      <div class="penna-code-block__panel penna-code-block__panel--collapsible">
        <button type="button" class="penna-code-block__expand" aria-expanded="true">
          <span class="penna-code-block__expand-label">收起代码</span>
        </button>
      </div>
    </div>`,
  );
  const preview = dom.window.document.getElementById("preview") as HTMLElement;
  new CodeListener(preview);

  const panel = preview.querySelector(
    ".penna-code-block__panel",
  ) as HTMLElement;
  const btn = preview.querySelector(
    ".penna-code-block__expand",
  ) as HTMLButtonElement;
  btn.click();

  expect(panel.classList.contains("penna-code-block__panel--collapsed")).toBe(
    true,
  );
  expect(btn.getAttribute("aria-expanded")).toBe("false");
});
