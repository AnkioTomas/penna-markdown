import { describe, expect, it, vi, beforeEach } from "vitest";
import { JSDOM } from "jsdom";

const { highlight, highlightAuto, getLanguage } = vi.hoisted(() => ({
  highlight: vi.fn((code: string, options: { language: string }) => ({
    value: `<span class="hljs-keyword">${options.language}</span>${code}`,
  })),
  highlightAuto: vi.fn((code: string) => ({
    value: `<span class="hljs-string">${code}</span>`,
  })),
  getLanguage: vi.fn((lang: string) => (lang ? {} : undefined)),
}));

vi.mock("highlight.js", () => ({
  default: {
    highlight,
    highlightAuto,
    getLanguage,
  },
}));

import { HighlightJs } from "@/renderer/highlight/highlight.js";

describe("renderer/highlight", () => {
  beforeEach(() => {
    highlight.mockClear();
    highlightAuto.mockClear();
    getLanguage.mockClear();
  });

  it("highlights enhanced code blocks with hljs", () => {
    const dom = new JSDOM(
      `
      <div class="cherry">
        <div class="cherry-code-block__panel language-js">
          <pre class="cherry-code-block__pre"><code class="language-js" data-cherry-code>const a = 1;</code></pre>
        </div>
      </div>
    `,
      { url: "https://example.com" },
    );

    const mount = dom.window.document.querySelector(".cherry")!;
    const highlighter = new HighlightJs(mount as HTMLElement);
    highlighter.run();

    expect(highlight).toHaveBeenCalled();
    const code = dom.window.document.querySelector("code")! as HTMLElement;
    expect(code.dataset.cherryHighlighted).toBe("1");
    expect(code.classList.contains("hljs")).toBe(true);
    expect(dom.window.document.getElementById("hljsTheme")).toBeNull();
  });

  it("highlightCodeHtml falls back to highlightAuto without language", () => {
    const dom = new JSDOM(`<div></div>`);
    const highlighter = new HighlightJs(dom.window.document.body);
    const html = highlighter.highlightCodeHtml("plain", "");

    expect(highlightAuto).toHaveBeenCalledWith("plain");
    expect(html).toContain("hljs-string");
  });

  it("skips already highlighted blocks", () => {
    const dom = new JSDOM(
      `<div><div class="cherry-code-block__panel"><pre><code data-cherry-code data-cherry-highlighted="1">x</code></pre></div></div>`,
    );
    const mount = dom.window.document.body;
    const highlighter = new HighlightJs(mount);
    highlighter.run();

    expect(highlight).not.toHaveBeenCalled();
    expect(highlightAuto).not.toHaveBeenCalled();
  });
});
