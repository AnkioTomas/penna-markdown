/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import {
  createEditorSyntaxHighlighting,
  defineEditorTag,
} from "@/editor/editor/cmSyntax.js";

describe("cmSyntax", () => {
  it("defineEditorTag returns unique tags", () => {
    const a = defineEditorTag();
    const b = defineEditorTag();
    expect(a).not.toBe(b);
  });

  it("createEditorSyntaxHighlighting accepts custom tags", () => {
    const alertTag = defineEditorTag();
    const ext = createEditorSyntaxHighlighting([{ tag: alertTag, class: "cm-alert" }]);
    expect(ext).toBeTruthy();
  });
});
