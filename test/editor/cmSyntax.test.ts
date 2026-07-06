/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { createEditorSyntaxHighlighting } from "@/editor/editor/cmSyntax.js";

describe("cmSyntax", () => {
  it("createEditorSyntaxHighlighting returns a valid extension", () => {
    const ext = createEditorSyntaxHighlighting();
    expect(ext).toBeTruthy();
  });
});
