import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

const ALERT_CASES = [
  {
    type: "note",
    title: "Note",
    body: "Useful information that users should know, even when skimming content.",
  },
  {
    type: "tip",
    title: "Tip",
    body: "Helpful advice for doing things better or more easily.",
  },
  {
    type: "important",
    title: "Important",
    body: "Key information users need to know to achieve their goal.",
  },
  {
    type: "warning",
    title: "Warning",
    body: "Urgent info that needs immediate user attention to avoid problems.",
  },
  {
    type: "caution",
    title: "Caution",
    body: "Advises about risks or negative outcomes of certain actions.",
  },
];

function alertMarkdown(type: string, body: string) {
  return `> [!${type.toUpperCase()}]\n> ${body}\n`;
}

function alertHtml(type: string, title: string, body: string) {
  return `<div class="penna-alert penna-alert--${type}">\n<p class="penna-alert__title">${title}</p>\n<p>${body}</p>\n</div>\n`;
}

it("is case-insensitive for alert type marker", () => {
  const engine = createEngine();
  const md = "> [!note]\n> Lower case marker\n";
  expect(renderMarkdown(engine, md)).toBe(
    alertHtml("note", "Note", "Lower case marker"),
  );
});
