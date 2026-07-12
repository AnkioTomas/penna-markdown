import type { Extension } from "@codemirror/state";
import {
  aiLockedReadOnly,
  aiMaskPlugin,
  aiStateField,
} from "./codemirror/extension";
import {
  aiDiffDecorations,
  aiDiffHunkActionsPlugin,
  createAIKeymap,
} from "./codemirror/diff-ui";

/** 创建 AI 功能所需的 CodeMirror 扩展 */
export function createAIExtension(): Extension[] {
  return [
    aiStateField,
    aiLockedReadOnly,
    createAIKeymap(),
    aiMaskPlugin,
    aiDiffDecorations,
    aiDiffHunkActionsPlugin,
  ];
}

export {
  aiStateField,
  isAILocked,
  IDLE_STATE,
  setAIState,
  allocGenId,
  type AIState,
} from "./codemirror/extension";
export {
  aiDiffDecorations,
  enterDiffPhase,
  cancelDiffPhase,
} from "./codemirror/diff-ui";
export { runAIAction, getAITargetRange, type AIRequestFn } from "./runAction";
export {
  buildHunks,
  diffLines,
  diffChars,
  hasPendingHunks,
  type DiffHunk,
  type HunkStatus,
  type DiffChunk,
} from "./diff";
