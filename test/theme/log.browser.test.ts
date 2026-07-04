/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { logD } from "@/theme/log.js";

describe("theme/log (browser)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logD uses console.info", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    logD("[cherry]", "browser debug");

    expect(infoSpy).toHaveBeenCalledWith("[cherry]", "browser debug");
    expect(logSpy).not.toHaveBeenCalled();
  });
});
