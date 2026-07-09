import { expect, it, vi } from "vitest";
import { Theme, THEME_EVENT_SKIN } from "@/theme/Theme.js";

async function createRenderTree() {
  const dom = new (await import("jsdom")).JSDOM(
    `<div id="root"><div id="render"></div></div>`,
  );
  const root = dom.window.document.getElementById("root")! as HTMLElement;
  const render = dom.window.document.getElementById("render")! as HTMLElement;
  return { root, render };
}

it("logs emit/on/off in debug mode", async () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const { root, render } = await createRenderTree();
  const theme = new Theme(true);
  const handler = vi.fn();

  theme.on(THEME_EVENT_SKIN, handler);
  theme.setTheme("claude", render, root);
  theme.off(THEME_EVENT_SKIN, handler);

  expect(logSpy).toHaveBeenCalledWith("[cherry]", "event:on", THEME_EVENT_SKIN);
  expect(logSpy).toHaveBeenCalledWith("[cherry]", "setTheme", {
    prev: "default",
    id: "claude",
  });
  expect(logSpy).toHaveBeenCalledWith(
    "[cherry]",
    "event:emit",
    THEME_EVENT_SKIN,
    {
      prev: "default",
      id: "claude",
      render,
    },
  );
  expect(logSpy).toHaveBeenCalledWith(
    "[cherry]",
    "event:off",
    THEME_EVENT_SKIN,
  );

  logSpy.mockRestore();
});
