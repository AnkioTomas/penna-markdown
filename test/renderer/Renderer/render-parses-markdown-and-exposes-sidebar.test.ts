import { expect, it } from "vitest";
import { createJsdomRenderer } from "../helpers";
import { BLOCK_HASH_ATTR } from "@/renderer/incremental/BlockIndex.js";

it("render parses markdown and exposes sidebar", () => {
  const { renderer, mount } = createJsdomRenderer();

  const result = renderer.render("# Hello\n\n## World");
  expect(result.html).toContain('id="Hello"');
  expect(result.html).toContain(BLOCK_HASH_ATTR);
  expect(result.blocks).toHaveLength(2);
  expect(mount.querySelector("h1")!.getAttribute(BLOCK_HASH_ATTR)).toBeTruthy();
  expect(renderer.getTocFlat()).toEqual([
    { level: 1, text: "Hello", id: "Hello" },
    { level: 2, text: "World", id: "World" },
  ]);
  expect(renderer.getToc()[0]?.children[0]?.text).toBe("World");

  const h1 = mount.querySelector("h1") as HTMLElement;
  expect(h1.id).toBe("Hello");

  renderer.destroy();
});
