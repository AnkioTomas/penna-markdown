import { TransformerEngine } from "@/transformer/TransformerEngine.js";

/** 测试用：`new TransformerEngine()` 全量语法。 */
export function createEngine() {
  return new TransformerEngine();
}

export function renderMarkdown(engine: TransformerEngine, markdown: string): string {
  return engine.render(engine.parse(markdown));
}
