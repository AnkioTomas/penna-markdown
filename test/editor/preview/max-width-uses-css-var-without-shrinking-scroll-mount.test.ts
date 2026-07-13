/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";
import { Theme } from "@/theme/Theme";
import { Preview } from "@/editor/preview/Preview";

it("preview maxWidth sets CSS var on mount", () => {
  document.body.innerHTML = "";
  const mount = document.createElement("div");
  document.body.append(mount);
  const log = new Log(false);
  const eventBus = new EventBus(false, "[test]", log);
  const theme = new Theme(eventBus, log, document.body, []);
  const preview = new Preview(mount, theme, eventBus, log, {
    maxWidth: "720px",
  });

  expect(mount.style.getPropertyValue("--cherry-preview-max-width")).toBe(
    "720px",
  );
  expect(mount.style.maxWidth).toBe("");

  preview.destroy();
});
