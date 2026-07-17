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
  return { root };
}

it("logs emit/on/off in debug mode", async () => {
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  const { root } = await createRenderTree();
  const log = new Log(true);
  const eventBus = new EventBus(true, "[penna]", log);
  const theme = new Theme(eventBus, log, root);
  const handler = vi.fn();

  eventBus.on(THEME_EVENT_SKIN, handler);
  theme.setTheme("claude");
  eventBus.off(THEME_EVENT_SKIN, handler);

  expect(infoSpy).toHaveBeenCalledWith("[penna]", "event:on", THEME_EVENT_SKIN);
  expect(infoSpy).toHaveBeenCalledWith("setTheme", {
    prev: "default",
    id: "claude",
  });
  expect(infoSpy).toHaveBeenCalledWith(
    "[penna]",
    "event:emit",
    THEME_EVENT_SKIN,
    {
      prev: "default",
      id: "claude",
      root,
    },
  );
  expect(infoSpy).toHaveBeenCalledWith(
    "[penna]",
    "event:off",
    THEME_EVENT_SKIN,
  );

  infoSpy.mockRestore();
});
