import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createTransformer } from "@/transformer/index.js";

const allCases = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../fixtures/gfm/cases.json"), "utf8"),
);

/** @param {number} id */
function gfmCase(id) {
  const c = allCases.find((x) => x.id === id);
  if (!c) throw new Error(`GFM case ${id} not found`);
  return c;
}

const BRACKET_AUTO_LINK_CASES = allCases.filter((c) => c.id >= 602 && c.id <= 620);

const EXT_AUTO_LINK_CASES = [
  { id: 621, name: "www. 域名识别" },
  { id: 622, name: "句子中的 www. 链接" },
  { id: 623, name: "www. 链接后的句点边界" },
  { id: 624, name: "www. 链接与括号定界" },
  { id: 625, name: "www. 链接含括号查询参数" },
  { id: 626, name: "www. 链接中 & 与实体定界" },
  { id: 627, name: "www. 链接在 < 处截断，剩余 < 转义" },
  { id: 628, name: "http/ftp 扩展 autolink" },
  { id: 629, name: "邮箱扩展 autolink" },
];

describe("GFM Autolinks #602-620 (bracket, no extension)", () => {
  const transformer = createTransformer({ extensions: [] });

  for (const c of BRACKET_AUTO_LINK_CASES) {
    it(`example ${c.id}`, () => {
      const { html } = transformer.render(c.markdown, { extensions: [] });
      expect(html).toBe(c.html);
    });
  }
});

describe("GFM Autolinks #621-629 (extension)", () => {
  const transformer = createTransformer({ extensions: ["autolink"] });

  it.each(EXT_AUTO_LINK_CASES)("example $id: $name", ({ id }) => {
    const c = gfmCase(id);
    const { html } = transformer.render(c.markdown, { extensions: ["autolink"] });
    expect(html).toBe(c.html);
  });
});
