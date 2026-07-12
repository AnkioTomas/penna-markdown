import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";
import { Theme } from "@/theme/Theme";

export function createTestBus(debug = false) {
  const log = new Log(debug);
  const eventBus = new EventBus(debug, "[cherry]", log);
  return { eventBus, log };
}

export function createTestTheme(
  root: HTMLElement = document.body,
  debug = false,
  themes?: string[],
) {
  const { eventBus, log } = createTestBus(debug);
  const theme = new Theme(eventBus, log, root, themes);
  return { theme, eventBus, log };
}
