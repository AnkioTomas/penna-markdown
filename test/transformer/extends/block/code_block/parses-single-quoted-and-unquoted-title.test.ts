import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";
import { buildEchartsImageSrc } from "@/transformer/extends/block/specialCode.js";

const ECHARTS_OPTIONS = '{"series":[{"type":"bar"}]}';

it("parses single-quoted and unquoted title", () => {
  const engine = () => createEnhancedEngine();
  const quoted = renderMarkdown(
    engine(),
    "```bash title='run.sh'\necho hi\n```",
  );
  expect(quoted).toContain('data-title="run.sh"');
  expect(quoted).toContain('class="penna-code-block__title">run.sh</span>');

  const bare = renderMarkdown(
    createEnhancedEngine(),
    "```bash title=Makefile\nall:\n```",
  );
  expect(bare).toContain('data-title="Makefile"');
});
