/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { Penna } from "@/editor/Penna";
import { AI_MENU_IDS } from "@/editor/toolbar/defaults";

it("custom ai-* command (not in AI_MENU_IDS) routes to onAiRequest", async () => {
  expect(AI_MENU_IDS).not.toContain("ai-frontmatter");

  document.body.innerHTML = '<div id="penna-editor"></div>';
  const onAiRequest = vi.fn(() => Promise.resolve("done"));
  const penna = new Penna(document.getElementById("penna-editor")!, {
    editor: { value: "# Title\n\nBody", onAiRequest },
    toolbar: false,
    statusbar: false,
    sidebar: false,
  });

  try {
    await Promise.resolve();
    penna.eventBus.emit("editor:command", { command: "ai-frontmatter" });
    await Promise.resolve();

    expect(onAiRequest).toHaveBeenCalledTimes(1);
    expect(onAiRequest.mock.calls[0][0]).toBe("frontmatter");
  } finally {
    penna.destroy();
  }
});
