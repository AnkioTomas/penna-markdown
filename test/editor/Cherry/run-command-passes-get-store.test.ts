/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { Cherry } from "@/editor/Cherry";
import { COMMANDS } from "@/editor/commands";
import type { Command, CommandContext } from "@/editor/commands/Command";
import type { ParserStore } from "@/transformer/core/ParserStore";

const PROBE = "__test_store_probe__";

type ProbeResult =
  | { kind: "missing" }
  | { kind: "null" }
  | { kind: "present"; store: ParserStore };

function installProbe(): {
  last: () => ProbeResult | undefined;
  uninstall: () => void;
} {
  let last: ProbeResult | undefined;
  const cmd: Command = {
    execute(_view, _payload, ctx: CommandContext) {
      if (!ctx.getStore) {
        last = { kind: "missing" };
        return true;
      }
      const store = ctx.getStore();
      last = store ? { kind: "present", store } : { kind: "null" };
      return true;
    },
  };
  const prev = COMMANDS[PROBE];
  COMMANDS[PROBE] = cmd;
  return {
    last: () => last,
    uninstall: () => {
      if (prev) COMMANDS[PROBE] = prev;
      else delete COMMANDS[PROBE];
    },
  };
}

function primePreview(cherry: Cherry) {
  cherry.eventBus.emit("editor:change", { markdown: cherry.getMarkdown() });
}

it("runCommand injects getStore (present after initial markdown render)", () => {
  document.body.innerHTML = '<div id="cherry-editor"></div>';
  const probe = installProbe();
  const cherry = new Cherry(document.getElementById("cherry-editor")!, {
    editor: { value: "# Title\n\nBody" },
    toolbar: false,
    statusbar: false,
    sidebar: false,
  });

  try {
    primePreview(cherry);
    const ok = cherry.runCommand(PROBE);
    expect(ok).toBe(true);
    const result = probe.last();
    expect(result?.kind).toBe("present");
  } finally {
    probe.uninstall();
    cherry.destroy();
  }
});

it("runCommand getStore is null when preview never rendered", () => {
  document.body.innerHTML = '<div id="cherry-editor"></div>';
  const probe = installProbe();
  const cherry = new Cherry(document.getElementById("cherry-editor")!, {
    editor: { value: "" },
    toolbar: false,
    statusbar: false,
    sidebar: false,
  });

  try {
    const ok = cherry.runCommand(PROBE);
    expect(ok).toBe(true);
    expect(probe.last()?.kind).toBe("null");
  } finally {
    probe.uninstall();
    cherry.destroy();
  }
});

it("editor:command bus path injects the same getStore semantics", () => {
  document.body.innerHTML = '<div id="cherry-editor"></div>';
  const probe = installProbe();
  const cherry = new Cherry(document.getElementById("cherry-editor")!, {
    editor: { value: "## Head" },
    toolbar: false,
    statusbar: false,
    sidebar: false,
  });

  try {
    primePreview(cherry);
    cherry.eventBus.emit("editor:command", { command: PROBE });
    const result = probe.last();
    expect(result?.kind).toBe("present");
  } finally {
    probe.uninstall();
    cherry.destroy();
  }
});
