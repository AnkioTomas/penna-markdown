import type { Extension } from "@codemirror/state";
import type { CherryAIOptions } from "@/editor/CherryOptions";
import { aiStateField } from "./aiState";
import { createAIKeymap } from "./aiKeymap";
import { aiMaskPlugin, aiLockedReadOnly } from "./aiMask";
import { aiDiffDecorations, aiDiffHunkActionsPlugin } from "./aiDiff";

export function createAIExtension(_options: CherryAIOptions): Extension[] {
  return [
    aiStateField,
    aiLockedReadOnly,
    createAIKeymap(),
    aiMaskPlugin,
    aiDiffDecorations,
    aiDiffHunkActionsPlugin,
  ];
}

export { diffChars } from "./diffChars";
export { diffLines, buildHunks } from "./diffLines";
export { buildAIToolbarItems } from "./defaults";
export { createAICommandListener } from "./aiBridge";
