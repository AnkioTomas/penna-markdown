import { JSDOM } from "jsdom";
import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";
import { Theme } from "@/theme/Theme";
import { Renderer } from "@/renderer/Renderer";
import type { RenderOption } from "@/renderer/RenderOption";

export function createJsdomRenderer(
  debug = false,
  html = `<div id="preview" class="penna"></div>`,
  optionOverrides: Partial<
    Omit<RenderOption, "mount" | "theme" | "eventBus" | "logger">
  > = {},
) {
  const dom = new JSDOM(html, { url: "http://localhost/" });
  const mount = dom.window.document.getElementById("preview") as HTMLElement;
  const log = new Log(debug);
  const eventBus = new EventBus(debug, "[test]", log);
  const theme = new Theme(eventBus, log, mount);
  theme.setTheme("default");
  const renderer = new Renderer({
    mount,
    theme,
    eventBus,
    logger: log,
    ...optionOverrides,
  });
  return { renderer, mount, theme, eventBus, log, dom };
}
