/**
 * @vitest-environment jsdom
 */

import { afterEach, expect, it, vi } from "vitest";
import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";
import { requestDialog } from "@/editor/dialog/requestDialog";
import { DialogHost } from "@/editor/dialog/DialogHost";

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

function createHost(): {
  host: DialogHost;
  eventBus: EventBus;
  mount: HTMLElement;
} {
  const mount = document.createElement("div");
  document.body.append(mount);
  const eventBus = new EventBus(false, "[test]", new Log(false));
  return { host: new DialogHost(mount, eventBus), eventBus, mount };
}

it("keeps a replacement dialog open after the previous close delay", async () => {
  vi.useFakeTimers();
  const { host, eventBus, mount } = createHost();

  const first = requestDialog(eventBus, "link");
  const second = requestDialog(eventBus, "table");
  await expect(first).resolves.toBeNull();

  await vi.advanceTimersByTimeAsync(200);
  expect(mount.querySelector<HTMLElement>(".penna-dialog-host")!.hidden).toBe(
    false,
  );

  host.destroy();
  await expect(second).resolves.toBeNull();
});

it("cancels the active dialog request when destroyed", async () => {
  const { host, eventBus } = createHost();

  const request = requestDialog(eventBus, "link");
  host.destroy();

  await expect(request).resolves.toBeNull();
});
