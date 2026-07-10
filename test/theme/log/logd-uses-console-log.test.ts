/**
 * @vitest-environment node
 */

import { expect, it, vi } from "vitest";
import { logD, logE, logW } from "@/core/log.js";

it("logD uses console.log", () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

  logD("[cherry]", "node debug");

  expect(logSpy).toHaveBeenCalledWith("[cherry]", "node debug");
  expect(infoSpy).not.toHaveBeenCalled();
});
