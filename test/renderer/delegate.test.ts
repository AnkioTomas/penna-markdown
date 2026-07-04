import { describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import {
  CHERRY_PREVIEW_CLASS,
  ensurePreviewDelegation,
  registerPreviewClickDelegation,
  releasePreviewDelegation,
} from "@/renderer/delegate.js";
import "@/renderer/interactions.js";

describe("renderer/delegate", () => {
  it("binds click handlers on cherry-preview only once", () => {
    const dom = new JSDOM(`<div id="preview" class="preview cherry"></div>`, {
      runScripts: "outside-only",
    });
    const preview = dom.window.document.getElementById("preview") as HTMLElement;
    const bound = ensurePreviewDelegation(preview);

    expect(bound).toBe(preview);
    expect(preview.classList.contains(CHERRY_PREVIEW_CLASS)).toBe(true);
    expect(ensurePreviewDelegation(preview)).toBe(preview);
  });

  it("delegates copy button clicks from cherry-preview", async () => {
    const dom = new JSDOM(
      `
      <div id="preview" class="cherry-preview cherry">
        <div class="cherry-code-block__panel">
          <button type="button" class="cherry-copy-code-button" aria-label="复制代码"></button>
          <pre><code data-cherry-code>const x = 1;</code></pre>
        </div>
      </div>
    `,
      { runScripts: "outside-only", url: "https://example.com" },
    );
    const { document, navigator } = dom.window;
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });

    const preview = document.getElementById("preview") as HTMLElement;
    ensurePreviewDelegation(preview);

    const btn = preview.querySelector(".cherry-copy-code-button") as HTMLButtonElement;
    btn.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("const x = 1;");
    expect(btn.classList.contains("is-copied")).toBe(true);
  });

  it("delegates code collapse clicks from cherry-preview", () => {
    const dom = new JSDOM(
      `
      <div id="preview" class="cherry-preview cherry">
        <div class="cherry-code-block__panel cherry-code-block__panel--collapsible">
          <button type="button" class="cherry-code-block__expand" aria-expanded="true">
            <span class="cherry-code-block__expand-label">收起代码</span>
          </button>
        </div>
      </div>
    `,
      { runScripts: "outside-only" },
    );
    const preview = dom.window.document.getElementById("preview") as HTMLElement;
    ensurePreviewDelegation(preview);

    const panel = preview.querySelector(".cherry-code-block__panel") as HTMLElement;
    const btn = preview.querySelector(".cherry-code-block__expand") as HTMLButtonElement;
    btn.click();

    expect(panel.classList.contains("cherry-code-block__panel--collapsed")).toBe(true);
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });

  it("supports custom delegated handlers", () => {
    const dom = new JSDOM(`<div class="cherry-preview"><button class="custom-action">go</button></div>`, {
      runScripts: "outside-only",
    });
    const preview = dom.window.document.querySelector(".cherry-preview") as HTMLElement;
    const handler = vi.fn();

    registerPreviewClickDelegation(".custom-action", (_event, target) => {
      handler(target.textContent);
    });
    ensurePreviewDelegation(preview);

    (preview.querySelector(".custom-action") as HTMLButtonElement).click();
    expect(handler).toHaveBeenCalledWith("go");

    releasePreviewDelegation(preview);
  });
});
