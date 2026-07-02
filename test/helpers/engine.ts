import { TransformerEngine } from "@/transformer/TransformerEngine.js";

export function createEngine() {
  return new TransformerEngine();
}

export function renderMarkdown(
  engine: TransformerEngine,
  markdown: string,
  root?: ParentNode | null,
): string {
  return engine.render(engine.parse(markdown), root);
}
