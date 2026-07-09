/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";

const LOG_CALLS = 4;

it("prints only once", async () => {
  vi.resetModules();
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  const { printCherryLogo } = await import("@/editor/printLogo.js");
  printCherryLogo();
  printCherryLogo();

  expect(logSpy).toHaveBeenCalledTimes(LOG_CALLS);
});
