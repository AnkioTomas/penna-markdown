import { expect, it } from "vitest";
import { escapeHtml } from "@/transformer/utils/escape.js";

it("escapeHtml encodes special characters", () => {
  expect(escapeHtml(`Tom & Jerry <3 "ok"`)).toBe(
    "Tom &amp; Jerry &lt;3 &quot;ok&quot;",
  );
});
