/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";
import { Theme } from "@/theme/Theme";
import { Preview } from "@/editor/preview/Preview";

function createPreview() {
  const mount = document.createElement("div");
  document.body.append(mount);
  const log = new Log(false);
  const eventBus = new EventBus(false, "[test]", log);
  const theme = new Theme(eventBus, log, document.body, []);
  const preview = new Preview(mount, theme, eventBus, log, {});
  return { preview, eventBus, mount };
}

it("getStore returns null before any render", () => {
  document.body.innerHTML = "";
  const { preview } = createPreview();

  expect(preview.getStore()).toBeNull();

  preview.destroy();
});

it("getStore returns non-null after first editor:change", () => {
  document.body.innerHTML = "";
  const { preview, eventBus } = createPreview();

  eventBus.emit("editor:change", { markdown: "# Hello" });

  const store = preview.getStore();
  expect(store).not.toBeNull();
  expect(typeof store!.has).toBe("function");

  preview.destroy();
});
