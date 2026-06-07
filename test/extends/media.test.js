import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("extends/media", () => {
  const engine = () => createTransformerWithExtensions(["media"]);

  it("renders !video[alt](url)", () => {
    const { html } = engine().render(
      "!video[演示](https://example.com/demo.mp4)\n",
    );
    expect(html).toBe(
      '<p><video src="https://example.com/demo.mp4" controls="controls">演示</video></p>\n',
    );
  });

  it("renders !audio[alt](url)", () => {
    const { html } = engine().render(
      "!audio[背景音乐](https://example.com/a.mp3)\n",
    );
    expect(html).toBe(
      '<p><audio src="https://example.com/a.mp3" controls="controls">背景音乐</audio></p>\n',
    );
  });

  it("supports video poster attribute", () => {
    const { html } = engine().render(
      "!video[带封面](https://example.com/demo.mp4){poster=https://example.com/poster.png}\n",
    );
    expect(html).toBe(
      '<p><video src="https://example.com/demo.mp4" poster="https://example.com/poster.png" controls="controls">带封面</video></p>\n',
    );
  });

  it("supports link title on media", () => {
    const { html } = engine().render(
      '!video[演示](https://example.com/demo.mp4 "说明")\n',
    );
    expect(html).toBe(
      '<p><video src="https://example.com/demo.mp4" title="说明" controls="controls">演示</video></p>\n',
    );
  });

  it("does not conflict with standard image syntax", () => {
    const { html } = engine().render(
      "![img](https://example.com/a.png)\n",
    );
    expect(html).toBe(
      '<p><img src="https://example.com/a.png" alt="img" /></p>\n',
    );
  });

  it("is disabled without extension", () => {
    const { html } = createTransformer().render(
      "!video[演示](https://example.com/demo.mp4)\n",
    );
    expect(html).toBe(
      '<p>!video<a href="https://example.com/demo.mp4">演示</a></p>\n',
    );
  });
});
