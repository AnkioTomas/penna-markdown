import { expect, it } from "vitest";
import { mediaMarkdown } from "@/editor/commands/groups/MediaCommand.js";

it("emits audio poster as cover attribute", () => {
  expect(
    mediaMarkdown({
      kind: "audio",
      label: "背景音乐",
      url: "https://example.com/a.mp3",
      poster: "https://example.com/cover.png",
    }),
  ).toBe(
    "!audio[背景音乐](https://example.com/a.mp3){poster=https://example.com/cover.png}\n",
  );
});
