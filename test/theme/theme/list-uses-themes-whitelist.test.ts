/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
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
