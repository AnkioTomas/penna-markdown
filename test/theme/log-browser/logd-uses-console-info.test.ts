/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { logD } from "@/theme/log.js";

it("logD uses console.info", () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

  logD("[cherry]", "browser debug");

  expect(infoSpy).toHaveBeenCalledWith("[cherry]", "browser debug");
  expect(logSpy).not.toHaveBeenCalled();
});
