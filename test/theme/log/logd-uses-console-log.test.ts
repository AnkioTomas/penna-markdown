/**
 * @vitest-environment node
 */

import { expect, it, vi } from "vitest";
import { Log } from "@/core/Log";

it("logD uses console.info", () => {
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

  const log = new Log(true);
  log.logD("[penna]", "node debug");

  expect(infoSpy).toHaveBeenCalledWith("[penna]", "node debug");
  infoSpy.mockRestore();
});
