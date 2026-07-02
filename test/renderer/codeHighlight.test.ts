import { describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import {
  hydrateCherryCodeHighlight,
  registerCherryCodeHighlightLoader,
} from "@/renderer/highlight/setup.js";

describe("renderer/codeHighlight", () => {
  it("applies adapter HTML to code blocks", async () => {
    const dom = new JSDOM(
      `
      <div class="cherry">
        <div class="cherry-code-block" data-lang="js">
          <div class="cherry-code-block__panel language-js" data-ext="js">
            <div class="cherry-code-block__header"></div>
            <pre class="cherry-code-block__pre"><code class="language-js" data-cherry-code>const a = 1;</code></pre>
          </div>
        </div>
      </div>
    `,
      { runScripts: "outside-only" },
    );
    const { document } = dom.window;
    const mount = document.querySelector(".cherry")!;

    (mount.querySelector(".cherry-code-block__panel") as HTMLElement).dataset.cherryHighlightLines = "1";

    const highlight = vi.fn(async (code, lang, ctx) => {
      expect(code).toBe("const a = 1;");
      expect(lang).toBe("js");
      expect(ctx.highlightLines).toEqual([1]);
      return '<span class="line cherry-code-block__line--highlighted" data-line="1"><span class="hljs-keyword">const</span> a = 1;</span>';
    });

    await hydrateCherryCodeHighlight(mount, {
      getAdapter: async () => ({ highlight }),
      isDark: () => false,
    });

    const code = mount.querySelector("code")! as HTMLElement;
    expect(highlight).toHaveBeenCalledOnce();
    expect(code.innerHTML).toContain("hljs-keyword");
    expect(code.dataset.cherryHighlighted).toBe("1");
  });

  it("registerCherryCodeHighlightLoader stores global loader", async () => {
    const load = vi.fn(async () => ({
      highlight: async () => "<span>x</span>",
    }));
    registerCherryCodeHighlightLoader(load);
    expect(typeof registerCherryCodeHighlightLoader).toBe("function");
  });
});
