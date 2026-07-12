import { expect, it, vi } from "vitest";
import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";
import { Theme } from "@/theme/Theme.js";
import { THEME_EVENT_SKIN } from "@/theme/event/ThemeSkinEvent";

async function createRenderTree() {
  const dom = new (await import("jsdom")).JSDOM(
    `<div id="root"><div id="render"></div></div>`,
  );
  const root = dom.window.document.getElementById("root")! as HTMLElement;
  const render = dom.window.document.getElementById("render")! as HTMLElement;
  return { root, render };
}

it("on / emit / off", async () => {
  const { root } = await createRenderTree();
  const log = new Log(false);
  const eventBus = new EventBus(false, "[cherry]", log);
  const theme = new Theme(eventBus, log, root);
  const handler = vi.fn();

  eventBus.on(THEME_EVENT_SKIN, handler);
  theme.setTheme("default");
  theme.setTheme("claude");
  expect(handler).toHaveBeenCalledTimes(1);

  eventBus.off(THEME_EVENT_SKIN, handler);
  theme.setTheme("default");
  expect(handler).toHaveBeenCalledTimes(1);
});
