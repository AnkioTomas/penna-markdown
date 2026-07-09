/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { createEditorSyntaxHighlighting } from "@/editor/editor/cmSyntax.js";

it("createEditorSyntaxHighlighting returns a valid extension", () => {
  const ext = createEditorSyntaxHighlighting();
  expect(ext).toBeTruthy();
});
