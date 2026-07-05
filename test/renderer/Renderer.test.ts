import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { Theme } from "@/theme/Theme.js";
import { Renderer } from "@/renderer/Renderer.js";
import { BLOCK_DOM_ID_ATTR } from "@/renderer/incremental/BlockCacheEntry.js";
import { SOURCE_LINE_ATTR } from "@/transformer/utils/sourceLine.js";

describe("renderer/Renderer", () => {
  it("render parses markdown and exposes sidebar", () => {
    const dom = new JSDOM(`<div id="preview" class="cherry"></div>`, {
      runScripts: "outside-only",
    });
    const mount = dom.window.document.getElementById("preview") as HTMLElement;
    const theme = new Theme();
    theme.setTheme("default", mount);

    const renderer = new Renderer({ mount, theme });

    const result = renderer.render("# Hello\n\n## World");
    expect(result.html).toContain('id="Hello"');
    expect(result.html).toContain('data-cherry-source-line="0"');
    expect(result.blocks).toHaveLength(2);
    expect(mount.querySelector("h1")!.getAttribute(BLOCK_DOM_ID_ATTR)).toBeTruthy();
    expect(renderer.getTocFlat()).toEqual([
      { level: 1, text: "Hello", id: "Hello" },
      { level: 2, text: "World", id: "World" },
    ]);
    expect(renderer.getToc()[0]?.children[0]?.text).toBe("World");

    const h1 = mount.querySelector("h1") as HTMLElement;
    expect(h1.id).toBe("Hello");
    expect(renderer.theme).toBe(theme);

    renderer.destroy();
  });

  it("ignores external overrides for renderer-owned transformer options", () => {
    const dom = new JSDOM(`<div id="preview" class="cherry"></div>`);
    const mount = dom.window.document.getElementById("preview") as HTMLElement;
    const theme = new Theme();
    theme.setTheme("default", mount);

    const renderer = new Renderer({
      mount,
      theme,
      transformer: {
        syntaxOptions: {
          atx_heading: { slug: false },
          code: { enable: false },
        },
        renderOptions: { sourceLineMap: false },
      },
    });

    const { html } = renderer.render("# Hello\n");
    expect(html).toContain('id="Hello"');
    expect(html).toContain(SOURCE_LINE_ATTR);
    expect(mount.querySelector("h1")!.getAttribute(BLOCK_DOM_ID_ATTR)).toBeTruthy();

    renderer.destroy();
  });
});
