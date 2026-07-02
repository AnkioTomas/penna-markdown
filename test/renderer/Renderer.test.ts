import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { createRenderer } from "@/renderer/Renderer.js";
import { TransformerEngine } from "@/transformer/TransformerEngine.js";

describe("renderer/Renderer", () => {
  it("render parses markdown and exposes toc", () => {
    const dom = new JSDOM(`<div id="preview" class="cherry"></div>`, {
      runScripts: "outside-only",
    });
    const mount = dom.window.document.getElementById("preview") as HTMLElement;
    const renderer = createRenderer({
      mount,
      transformer: new TransformerEngine(),
      watchTheme: false,
    });

    const result = renderer.render("# Hello\n\n## World");
    expect(result.html).toContain("<h1>");
    expect(renderer.getTocFlat()).toEqual([
      { level: 1, text: "Hello", id: "Hello" },
      { level: 2, text: "World", id: "World" },
    ]);
    expect(renderer.getToc()[0]?.children[0]?.text).toBe("World");

    const h1 = mount.querySelector("h1") as HTMLElement;
    expect(h1.id).toBe("Hello");

    renderer.destroy();
  });
});
