import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

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

function alertMarkdown(type, body) {
  return `> [!${type.toUpperCase()}]\n> ${body}\n`;
}

function alertHtml(type, title, body) {
  return `<div class="cherry-alert cherry-alert--${type}">\n<p class="cherry-alert__title">${title}</p>\n<p>${body}</p>\n</div>\n`;
}

describe("alert extension", () => {
  it.each(ALERT_CASES)("renders $type alert", ({ type, title, body }) => {
    const t = createTransformerWithExtensions(["alert"]);
    expect(renderMarkdown(t, alertMarkdown(type, body))).toBe(alertHtml(type, title, body));
  });

  it("is case-insensitive for alert type marker", () => {
    const t = createTransformerWithExtensions(["alert"]);
    const md = "> [!note]\n> Lower case marker\n";
    expect(renderMarkdown(t, md)).toBe(alertHtml("note", "Note", "Lower case marker"));
  });

  it("supports multiple paragraphs", () => {
    const t = createTransformerWithExtensions(["alert"]);
    const md = "> [!TIP]\n> First paragraph\n>\n> Second paragraph\n";
    expect(renderMarkdown(t, md)).toBe(
      `<div class="cherry-alert cherry-alert--tip">\n<p class="cherry-alert__title">Tip</p>\n<p>First paragraph</p>\n<p>Second paragraph</p>\n</div>\n`,
    );
  });

  it("does not affect regular blockquotes", () => {
    const t = createTransformerWithExtensions(["alert"]);
    expect(renderMarkdown(t, "> regular quote\n")).toBe(
      "<blockquote>\n<p>regular quote</p>\n</blockquote>\n",
    );
  });

  it("is disabled without extension", () => {
    const t = createEngine();
    expect(renderMarkdown(t, "> [!NOTE]\n> text\n")).toBe(
      "<blockquote>\n<p>[!NOTE]\ntext</p>\n</blockquote>\n",
    );
  });
});
