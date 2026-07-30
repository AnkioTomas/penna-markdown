import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("supports custom title after alert marker", () => {
  const md = `> [!WARNING] 防御建议
> - SSRF：限制请求协议（仅允许 HTTP/HTTPS），禁止访问内网 IP，禁用重定向
> - SSTI：对用户输入进行严格过滤，避免直接拼接模板
> - MySQL：对内网数据库设置访问白名单，禁止外网直接访问
`;
  const html = renderMarkdown(createEngine(), md);

  expect(html).toContain('<div class="penna-alert penna-alert--warning">');
  expect(html).toContain('<p class="penna-alert__title">防御建议</p>');
  expect(html).toContain("<ul>");
  expect(html).toContain("SSRF：限制请求协议");
  expect(html).toContain("SSTI：对用户输入进行严格过滤");
  expect(html).toContain("MySQL：对内网数据库设置访问白名单");
  expect(html).not.toContain("> Warning</p>");
});

it("renders inline markdown in the custom title", () => {
  const html = renderMarkdown(
    createEngine(),
    "> [!TIP] **加粗**标题\n> 正文\n",
  );
  expect(html).toContain(
    '<p class="penna-alert__title"><strong>加粗</strong>标题</p>',
  );
  expect(html).toContain("<p>正文</p>");
});

it("falls back to the default title when only whitespace follows the marker", () => {
  const html = renderMarkdown(createEngine(), "> [!NOTE]   \n> 正文\n");
  expect(html).toContain('<p class="penna-alert__title">Note</p>');
});
