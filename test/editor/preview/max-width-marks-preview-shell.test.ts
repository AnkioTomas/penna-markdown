/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";
import { Theme } from "@/theme/Theme";
import { Preview } from "@/editor/preview/Preview";

it("preview maxWidth marks the scroll shell, not the render mount", () => {
  document.body.innerHTML = "";
  const shell = document.createElement("div");
  shell.className = "cherry-preview";
  const mount = document.createElement("div");
  mount.className = "cherry-render";
  shell.append(mount);
  document.body.append(shell);

  const log = new Log(false);
  const eventBus = new EventBus(false, "[test]", log);
  const theme = new Theme(eventBus, log, document.body, []);
  const preview = new Preview(mount, theme, eventBus, log, {
    maxWidth: "720px",
  });

  expect(shell.style.getPropertyValue("--cherry-preview-max-width")).toBe(
    "720px",
  );
  expect(shell.classList.contains("cherry-preview--constrained")).toBe(true);
  expect(mount.classList.contains("cherry-preview--constrained")).toBe(false);
  expect(mount.style.maxWidth).toBe("");

  preview.destroy();
});
