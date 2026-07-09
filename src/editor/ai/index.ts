import type { Extension } from "@codemirror/state";
import type { CherryAIOptions } from "@/editor/CherryOptions";
import { resolveAIItems } from "./defaults";
import { aiStateField } from "./aiState";
import { createAIBubbleExtensions } from "./aiBubble";
import { aiMaskPlugin, aiGeneratingReadOnly } from "./aiMask";
import { aiDiffDecorations, aiDiffActionsPlugin } from "./aiDiff";

export function createAIExtension(options: CherryAIOptions): Extension[] {
  const items = resolveAIItems(options.items);

  return [
    aiStateField,
    aiGeneratingReadOnly,
    ...createAIBubbleExtensions(items, options.AIRequest),
    aiMaskPlugin,
    aiDiffDecorations,
    aiDiffActionsPlugin,
  ];
}

export { diffChars } from "./diffChars";
