import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import { gfmBlockSyntax, gfmInlineSyntax } from "@/transformer/gfm/index.js";
import type { TransformerEngineOptions } from "@/transformer/TransformerEngineOptions.js";

export function createEngine(options: TransformerEngineOptions = {}) {
  return new TransformerEngine({
    inlineParsers: gfmInlineSyntax,
    blockParsers: gfmBlockSyntax,
    ...options,
  });
}

export function renderMarkdown(engine: TransformerEngine, markdown: string): string {
  return engine.render(engine.parse(markdown));
}
