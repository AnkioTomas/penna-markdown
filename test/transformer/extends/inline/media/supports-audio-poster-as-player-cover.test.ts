import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("supports audio poster as player cover", () => {
  const html = renderMarkdown(
    createEngine(),
    "!audio[背景音乐](https://example.com/a.mp3){poster=https://example.com/cover.png}\n",
  );
  expect(html).toContain(
    'class="penna-audio-player__cover penna-audio-player__cover--image"',
  );
  expect(html).toContain(
    '<img class="penna-audio-player__cover-img" src="https://example.com/cover.png" alt="" loading="lazy" />',
  );
});
