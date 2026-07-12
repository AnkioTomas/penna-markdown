/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";

const LOG_CALLS_PER_INVOCATION = 4;

it("prints cherry branding to console", async () => {
  vi.resetModules();
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  const { printCherryLogo } = await import("@/editor/Logo");
  printCherryLogo();

  expect(logSpy).toHaveBeenCalledTimes(LOG_CALLS_PER_INVOCATION);
});
