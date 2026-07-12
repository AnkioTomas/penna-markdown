/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { Log } from "@/core/Log";

it("logD uses console.info", () => {
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

  const log = new Log(true);
  log.logD("[cherry]", "browser debug");

  expect(infoSpy).toHaveBeenCalledWith("[cherry]", "browser debug");
  infoSpy.mockRestore();
});
