import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("renders !audio[alt](url) as styled player", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(
    engine(),
    "!audio[背景音乐](https://example.com/a.mp3)\n",
  );
  expect(html).toBe(
    '<figure class="cherry-media cherry-audio"><div class="cherry-audio-player"><div class="cherry-audio-player__cover" aria-hidden="true"></div><div class="cherry-audio-player__main"><p class="cherry-audio-player__title">背景音乐</p><audio class="cherry-audio-player__track" src="https://example.com/a.mp3" controls preload="metadata"></audio></div></div></figure>\n',
  );
});
