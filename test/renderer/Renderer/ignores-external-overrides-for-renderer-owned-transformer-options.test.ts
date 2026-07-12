import { expect, it } from "vitest";
import { createJsdomRenderer } from "../helpers";
import { BLOCK_HASH_ATTR } from "@/renderer/incremental/BlockIndex.js";

it("ignores external overrides for renderer-owned transformer options", () => {
  const { renderer, mount } = createJsdomRenderer();

  const { html } = renderer.render("# Hello\n");
  expect(html).toContain('id="Hello"');
  expect(html).toContain(BLOCK_HASH_ATTR);
  expect(mount.querySelector("h1")!.getAttribute(BLOCK_HASH_ATTR)).toBeTruthy();

  renderer.destroy();
});
