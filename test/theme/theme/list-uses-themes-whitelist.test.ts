/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import REGISTERED_THEMES from "@/theme/ThemeRegister.js";
import { Theme } from "@/theme/Theme.js";
import { EventBus } from "@/core/event/EventBus.js";
import { Log } from "@/core/Log.js";

it("lists all registered themes by default", () => {
  const log = new Log();
  const theme = new Theme(
    new EventBus(false, "[test]", log),
    log,
    document.body,
  );
  expect(theme.list()).toEqual([...REGISTERED_THEMES]);
});

it("lists only whitelisted themes when themes is provided", () => {
  const log = new Log();
  const theme = new Theme(
    new EventBus(false, "[test]", log),
    log,
    document.body,
    ["github"],
  );
  expect(theme.list()).toEqual(["github"]);
});

it("lists all registered themes when whitelist is empty", () => {
  const log = new Log();
  const theme = new Theme(
    new EventBus(false, "[test]", log),
    log,
    document.body,
    [],
  );
  expect(theme.list()).toEqual([...REGISTERED_THEMES]);
});

it("skips unknown theme without changing id", () => {
  const log = new Log();
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const theme = new Theme(
    new EventBus(false, "[test]", log),
    log,
    document.body,
    ["github"],
  );
  theme.setTheme("default");
  expect(theme.getTheme().id).toBe("default");
  expect(errorSpy).toHaveBeenCalled();
  theme.setTheme("github");
  expect(theme.getTheme().id).toBe("github");
  theme.setTheme("not-a-theme");
  expect(theme.getTheme().id).toBe("github");
  errorSpy.mockRestore();
});
