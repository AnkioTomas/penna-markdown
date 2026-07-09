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

it("on / emit / off", async () => {
  const { root, render } = await createRenderTree();
  const theme = new Theme();
  const handler = vi.fn();

  theme.on(THEME_EVENT_SKIN, handler);
  theme.setTheme("default", render, root);
  theme.setTheme("claude", render, root);
  expect(handler).toHaveBeenCalledTimes(1);

  theme.off(THEME_EVENT_SKIN, handler);
  theme.setTheme("default", render, root);
  expect(handler).toHaveBeenCalledTimes(1);
});
