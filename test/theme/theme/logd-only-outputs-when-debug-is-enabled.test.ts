import { expect, it, vi } from "vitest";
import { Theme, THEME_EVENT_SKIN } from "@/theme/Theme.js";

async function createRenderTree() {
  const dom = new (await import("jsdom")).JSDOM(
    `<div id="root"><div id="render"></div></div>`,
  );
  const root = dom.window.document.getElementById("root")! as HTMLElement;
  const render = dom.window.document.getElementById("render")! as HTMLElement;
  return { root, render };
}

it("logD only outputs when debug is enabled", () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  const quiet = new Theme();
  quiet.logD("hidden");
  quiet.logW("warn");
  quiet.logE("error");
  expect(logSpy).not.toHaveBeenCalled();
  expect(infoSpy).not.toHaveBeenCalled();
  expect(warnSpy).toHaveBeenCalledWith("[cherry]", "warn");
  expect(errorSpy).toHaveBeenCalledWith("[cherry]", "error");

  logSpy.mockClear();
  infoSpy.mockClear();
  warnSpy.mockClear();
  errorSpy.mockClear();

  const verbose = new Theme(true);
  expect(verbose.isDebug()).toBe(true);
  verbose.logD("visible");
  verbose.logW("warn2");
  verbose.logE("error2");
  expect(logSpy).toHaveBeenCalledWith("[cherry]", "visible");
  expect(warnSpy).toHaveBeenCalledWith("[cherry]", "warn2");
  expect(errorSpy).toHaveBeenCalledWith("[cherry]", "error2");

  logSpy.mockRestore();
  infoSpy.mockRestore();
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});
