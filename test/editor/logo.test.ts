/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, afterEach } from "vitest";

const LOG_CALLS = 4;

describe("printCherryLogo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints colorful welcome with GitHub link in browser", async () => {
    vi.resetModules();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { printCherryLogo } = await import("@/editor/printLogo.js");
    printCherryLogo();

    expect(logSpy).toHaveBeenCalledTimes(LOG_CALLS);
    const flat = logSpy.mock.calls.flat(2).join(" ");
    expect(flat).toContain("Cherry Markdown Next");
    expect(flat).toContain("AnkioTomas/cherry-markdown-net");
    expect(flat).toContain("ankio.net");
    expect(flat).toContain("github.com");
    expect(flat).not.toContain("cursor:pointer");
  });

  it("prints only once", async () => {
    vi.resetModules();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { printCherryLogo } = await import("@/editor/printLogo.js");
    printCherryLogo();
    printCherryLogo();

    expect(logSpy).toHaveBeenCalledTimes(LOG_CALLS);
  });
});
