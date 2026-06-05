import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import { builtinBlockSyntax, builtinInlineSyntax } from "@/transformer/gfm/builtin.js";

export function createEngine(options = {}) {
  return new TransformerEngine({
    blockParsers: builtinBlockSyntax,
    inlineParsers: builtinInlineSyntax,
    ...options,
  });
}
