import { describe, expect, it } from "vitest";
import {
  createEngine,
  createEngineWithExtensions,
  renderMarkdown,
} from "../helpers/engine.js";

describe("highlight extension", () => {
  it("renders ==text== as mark", () => {
    const t = createEngineWithExtensions(["highlight"]);
    expect(renderMarkdown(t, "==hello==")).toBe(
      '<p><mark class="cherry-mark">hello</mark></p>\n',
    );
  });

  it("supports nested inline", () => {
    const t = createEngineWithExtensions(["highlight"]);
    expect(renderMarkdown(t, "==**bold**==")).toBe(
      '<p><mark class="cherry-mark"><strong>bold</strong></mark></p>\n',
    );
  });

  it("does not hang on unclosed highlight at strong-break opener", () => {
    const t = createEngine();
    expect(renderMarkdown(t, "==重要={.important}")).toBe("<p>==重要=</p>\n");
  });
});
