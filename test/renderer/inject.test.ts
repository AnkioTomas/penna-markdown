import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { injectHeadingIds } from "@/renderer/toc/inject.js";

describe("renderer/toc/inject", () => {
  it("injects heading ids from text content", () => {
    const dom = new JSDOM(`
      <div class="cherry-preview cherry">
        <h1>Hello World</h1>
        <h2>Sub Title</h2>
        <h2>Sub Title</h2>
      </div>
    `);
    const preview = dom.window.document.querySelector(".cherry-preview") as HTMLElement;
    injectHeadingIds(preview);

    expect(preview.querySelector("h1")?.id).toBe("Hello-World");
    expect(preview.querySelectorAll("h2")[0]?.id).toBe("Sub-Title");
    expect(preview.querySelectorAll("h2")[1]?.id).toBe("Sub-Title-1");
  });
});
