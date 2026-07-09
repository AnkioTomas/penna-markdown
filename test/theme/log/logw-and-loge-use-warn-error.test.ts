/**
 * @vitest-environment node
 */

import { expect, it, vi } from "vitest";
import { logD, logE, logW } from "@/theme/log.js";

it("logW and logE use warn/error", () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  logW("[cherry]", "w");
  logE("[cherry]", "e");

  expect(warnSpy).toHaveBeenCalledWith("[cherry]", "w");
  expect(errorSpy).toHaveBeenCalledWith("[cherry]", "e");
});
