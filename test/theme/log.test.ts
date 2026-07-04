/**
 * @vitest-environment node
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { logD, logE, logW } from "@/theme/log.js";

describe("theme/log (node)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logD uses console.log", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    logD("[cherry]", "node debug");

    expect(logSpy).toHaveBeenCalledWith("[cherry]", "node debug");
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("logW and logE use warn/error", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logW("[cherry]", "w");
    logE("[cherry]", "e");

    expect(warnSpy).toHaveBeenCalledWith("[cherry]", "w");
    expect(errorSpy).toHaveBeenCalledWith("[cherry]", "e");
  });
});
