import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

const MD = ["```js", "const x = 1;", "```", "", "```", "plain", "```"].join(
  "\n",
);

it("marks wrap and line number options on the block", () => {
  const defaults = renderMarkdown(
    createEngine({ syntaxOptions: { code: { enable: true } } }),
    MD,
  );
  expect(defaults).toContain('class="penna-code-block"');
  expect(defaults).not.toContain("penna-code-wrap");
  expect(defaults).not.toContain("penna-code-no-line-numbers");

  const custom = renderMarkdown(
    createEngine({
      syntaxOptions: { code: { enable: true, wrap: true, lineNumbers: false } },
    }),
    MD,
  );
  expect(custom).toContain(
    'class="penna-code-block penna-code-wrap penna-code-no-line-numbers"',
  );
  // 无语言的围栏块没有行号，只需要换行
  expect(custom).toContain('<pre class="penna-code-wrap">');
});
