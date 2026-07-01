import { describe, expect, it } from "vitest";
import { createEngine, createEngineWithExtensions, renderMarkdown } from "../helpers/engine.js";

describe("extends/spoiler", () => {
  const engine = () => createEngineWithExtensions(["spoiler"]);

  it("renders !! text !! as spoiler", () => {
    const html = renderMarkdown(engine(), "这是 !! 剧透内容 !! 正常文字\n");
    expect(html).toBe(
      '<p>这是 <span class="cherry-spoiler">剧透内容</span> 正常文字</p>\n',
    );
  });

  it("supports nested inline markup", () => {
    const html = renderMarkdown(engine(), "!! **加粗剧透** !!\n");
    expect(html).toBe(
      '<p><span class="cherry-spoiler"><strong>加粗剧透</strong></span></p>\n',
    );
  });

  it("requires space after opening !!", () => {
    const html = renderMarkdown(engine(), "!!剧透内容 !!\n");
    expect(html).toBe("<p>!!剧透内容 !!</p>\n");
  });

  it("requires space before closing !!", () => {
    const html = renderMarkdown(engine(), "!! 剧透内容!!\n");
    expect(html).toBe("<p>!! 剧透内容!!</p>\n");
  });

  it("rejects empty spoiler", () => {
    const html = renderMarkdown(engine(), "!!  !!\n");
    expect(html).toBe("<p>!!  !!</p>\n");
  });

  it("is disabled without extension", () => {
    const html = renderMarkdown(createEngine(), "!! 剧透 !!\n");
    expect(html).toBe("<p>!! 剧透 !!</p>\n");
  });

  it("renders {click} as checkbox spoiler", () => {
    const html = renderMarkdown(createEngineWithExtensions(["spoiler", "html_attrs"]),
      "!! 点击显示 !! {click}\n",
    );
    expect(html).toBe(
      '<p><label class="cherry-spoiler click"><input type="checkbox" class="cherry-spoiler__toggle" hidden><span class="cherry-spoiler__text">点击显示</span></label></p>\n',
    );
  });

  it("renders {.click} as checkbox spoiler", () => {
    const html = renderMarkdown(createEngineWithExtensions(["spoiler", "html_attrs"]),
      "!! 点击显示 !! {.click}\n",
    );
    expect(html).toBe(
      '<p><label class="cherry-spoiler click"><input type="checkbox" class="cherry-spoiler__toggle" hidden><span class="cherry-spoiler__text">点击显示</span></label></p>\n',
    );
  });
});
