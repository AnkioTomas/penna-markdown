import { expect, it, vi } from "vitest";
import { Log } from "@/core/Log";

it("logD only outputs when debug is enabled", () => {
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  const quiet = new Log(false);
  quiet.logD("hidden");
  quiet.logW("warn");
  quiet.logE("error");
  expect(infoSpy).not.toHaveBeenCalled();
  expect(warnSpy).toHaveBeenCalledWith("warn");
  expect(errorSpy).toHaveBeenCalledWith("error");

  infoSpy.mockClear();
  warnSpy.mockClear();
  errorSpy.mockClear();

  const verbose = new Log(true);
  verbose.logD("visible");
  verbose.logW("warn2");
  verbose.logE("error2");
  expect(infoSpy).toHaveBeenCalledWith("visible");
  expect(warnSpy).toHaveBeenCalledWith("warn2");
  expect(errorSpy).toHaveBeenCalledWith("error2");

  infoSpy.mockRestore();
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});
