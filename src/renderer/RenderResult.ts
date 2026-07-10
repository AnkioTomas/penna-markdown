import { MarkdownNode } from "@/transformer/core/MarkdownNode";
import { BlockIndex } from "@/renderer/incremental/BlockIndex";

export interface RenderResult {
  html: string;
  ast: MarkdownNode;
  blocks: BlockIndex[];
  partial?: boolean;
  changedStartLines?: number[];
}
