/**
 * @vitest-environment node
 */

import { expect, it, vi } from "vitest";
import { Log } from "@/core/Log";

it("logW and logE use warn/error", () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  const log = new Log(false);
  log.logW("warn-msg");
  log.logE("error-msg");

  expect(warnSpy).toHaveBeenCalledWith("warn-msg");
  expect(errorSpy).toHaveBeenCalledWith("error-msg");
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});
