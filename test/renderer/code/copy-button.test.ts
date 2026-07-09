/**
 * @vitest-environment jsdom
 */
import { expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import { CodeListener } from "@/renderer/code/code.js";

it("delegates copy button clicks", async () => {
  const dom = new JSDOM(
    `<div id="preview">
      <div class="cherry-code-block__panel">
        <button type="button" class="cherry-copy-code-button" aria-label="复制代码"></button>
        <pre><code data-cherry-code>const x = 1;</code></pre>
      </div>
    </div>`,
    { url: "https://example.com" },
  );
  const { document, navigator } = dom.window;
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });

  const preview = document.getElementById("preview") as HTMLElement;
  new CodeListener(preview);

  const btn = preview.querySelector(
    ".cherry-copy-code-button",
  ) as HTMLButtonElement;
  btn.click();
  await new Promise((r) => setTimeout(r, 0));

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith("const x = 1;");
  expect(btn.classList.contains("is-copied")).toBe(true);
});
