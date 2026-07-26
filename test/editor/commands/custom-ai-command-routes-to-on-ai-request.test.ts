/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { Penna } from "@/editor/Penna";
import { AI_MENU_IDS } from "@/editor/toolbar/defaults";
import type { OnAiRequest } from "@/editor/editor/EditorOptions";

it("custom ai-* command routes to onAiRequest, even on empty doc", async () => {
  expect(AI_MENU_IDS).not.toContain("ai-frontmatter");

  document.body.innerHTML = '<div id="penna-editor"></div>';
  const onAiRequest = vi.fn<OnAiRequest>(() => Promise.resolve("done"));
  const penna = new Penna(document.getElementById("penna-editor")!, {
    editor: { value: "", onAiRequest },
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
