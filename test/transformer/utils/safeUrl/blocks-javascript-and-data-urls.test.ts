import { expect, it } from "vitest";
import {
  isHttpUrl,
  isSafeUrl,
  renderSafeAnchor,
  renderSafeImage,
} from "@/transformer/utils/safeUrl.js";

it("blocks javascript and data URLs", () => {
  expect(isSafeUrl("javascript:alert(1)")).toBe(false);
  expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
  expect(isSafeUrl("file:///etc/passwd")).toBe(false);
});
