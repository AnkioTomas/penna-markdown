import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("extends/media", () => {
  const engine = () => createTransformerWithExtensions(["media"]);

  it("renders !video[alt](url) as styled figure", () => {
    const { html } = engine().render(
      "!video[演示](https://example.com/demo.mp4)\n",
    );
    expect(html).toBe(
      '<figure class="cherry-media cherry-video"><video class="cherry-media__player" src="https://example.com/demo.mp4" controls playsinline preload="metadata"></video><figcaption class="cherry-media__caption">演示</figcaption></figure>\n',
    );
  });

  it("renders !audio[alt](url) as styled player", () => {
    const { html } = engine().render(
      "!audio[背景音乐](https://example.com/a.mp3)\n",
    );
    expect(html).toBe(
      '<figure class="cherry-media cherry-audio"><div class="cherry-audio-player"><div class="cherry-audio-player__cover" aria-hidden="true"></div><div class="cherry-audio-player__main"><p class="cherry-audio-player__title">背景音乐</p><audio class="cherry-audio-player__track" src="https://example.com/a.mp3" controls preload="metadata"></audio></div></div></figure>\n',
    );
  });

  it("supports video poster attribute", () => {
    const { html } = engine().render(
      "!video[带封面](https://example.com/demo.mp4){poster=https://example.com/poster.png}\n",
    );
    expect(html).toContain('poster="https://example.com/poster.png"');
    expect(html).toContain('class="cherry-media cherry-video"');
  });

  it("supports audio poster as player cover", () => {
    const { html } = engine().render(
      "!audio[背景音乐](https://example.com/a.mp3){poster=https://example.com/cover.png}\n",
    );
    expect(html).toContain('class="cherry-audio-player__cover cherry-audio-player__cover--image"');
    expect(html).toContain(
      '<img class="cherry-audio-player__cover-img" src="https://example.com/cover.png" alt="" />',
    );
  });

  it("supports link title on media", () => {
    const { html } = engine().render(
      '!video[演示](https://example.com/demo.mp4 "说明")\n',
    );
    expect(html).toContain('title="说明"');
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
