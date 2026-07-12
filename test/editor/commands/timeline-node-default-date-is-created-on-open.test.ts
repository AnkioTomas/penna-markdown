/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { timelineNodeDialog } from "@/editor/commands/groups/TimelineCommand.js";

it("uses the date when the node dialog opens", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2030-02-03T12:00:00Z"));
  const host = document.createElement("div");

  const cleanup = timelineNodeDialog.render(
    host,
    {},
    {
      onSubmit: () => {},
      onCancel: () => {},
    },
  );

  expect(host.querySelector<HTMLInputElement>('[name="time"]')?.value).toBe(
    "2030-02-03",
  );
  cleanup();
  vi.useRealTimers();
});
