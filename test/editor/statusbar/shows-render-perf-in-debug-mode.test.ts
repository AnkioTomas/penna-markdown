/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { createTestEventBus } from "../../_helpers/eventBus";
import { StatusBar } from "@/editor/statusbar/StatusBar";

it("does not create perf element when debug is false", () => {
  const mount = document.createElement("div");
  const eventBus = createTestEventBus();
  const statusBar = new StatusBar(mount, eventBus, false);

  expect(mount.querySelector(".cherry-statusbar-perf")).toBeNull();

  statusBar.destroy();
});

it("shows latest render type and timing to the right of refresh in debug mode", () => {
  const mount = document.createElement("div");
  const eventBus = createTestEventBus();
  const statusBar = new StatusBar(mount, eventBus, true);

  const right = mount.querySelector(".cherry-statusbar-right")!;
  const perfEl = right.querySelector(".cherry-statusbar-perf") as HTMLElement;
  const refreshBtn = right.querySelector("button")!;

  expect(perfEl).not.toBeNull();
  expect(perfEl.textContent).toBe("无");
  expect(refreshBtn.nextElementSibling).toBe(perfEl);

  eventBus.emit("preview:rendered", {
    markdown: "# hi",
    html: "<h1>hi</h1>",
    ast: {} as never,
    blocks: [],
    toc: [],
    partial: false,
    changedStartLines: [],
    fullRenderMs: 12.345,
  });
  expect(perfEl.textContent).toBe("全量 12.3ms");

  eventBus.emit("preview:rendered", {
    markdown: "# hi!",
    html: "<h1>hi!</h1>",
    ast: {} as never,
    blocks: [],
    toc: [],
    partial: true,
    changedStartLines: [1],
    incrementalRenderMs: 3.21,
  });
  expect(perfEl.textContent).toBe("增量 3.2ms");

  statusBar.destroy();
});
