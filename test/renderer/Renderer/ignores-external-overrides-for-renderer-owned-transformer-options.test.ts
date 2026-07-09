import { expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { Theme } from "@/theme/Theme.js";
import { Renderer } from "@/renderer/Renderer.js";
import { BLOCK_HASH_ATTR } from "@/renderer/incremental/BlockIndex.js";

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
  expect(html).toContain(BLOCK_HASH_ATTR);
  expect(mount.querySelector("h1")!.getAttribute(BLOCK_HASH_ATTR)).toBeTruthy();

  renderer.destroy();
});
