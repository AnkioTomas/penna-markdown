import type { EditorView } from "@codemirror/view";
import type { OnAiRequest } from "@/editor/editor/EditorOptions";
import type { Theme } from "@/theme/Theme";
import type { Log } from "@/core/Log";
import { enterDiffPhase } from "./codemirror/diff-ui";
import {
  allocGenId,
  aiMaskPlugin,
  aiStateField,
  isAILocked,
  setAIState,
  IDLE_STATE,
} from "./codemirror/extension";

export type AIRequestFn = OnAiRequest;

/**
 * 获取 AI 操作目标范围：优先当前选区，否则使用整个文档。
 *
 * @param view 要读取选区和文档内容的编辑器视图。
 * @returns 目标文本及其在文档中的起止位置。
 */
export function getAITargetRange(view: EditorView): {
  from: number;
  to: number;
  text: string;
} {
  const sel = view.state.selection.main;
  if (!sel.empty) {
    return {
      from: sel.from,
      to: sel.to,
      text: view.state.doc.sliceString(sel.from, sel.to),
    };
  }
  const doc = view.state.doc;
  return {
    from: 0,
    to: doc.length,
    text: doc.toString(),
  };
}

/**
 * 发起 AI 操作，并在有效响应返回后进入差异确认阶段。
 *
 * @param view 要读取和更新的编辑器视图。
 * @param action 要执行的 AI 操作标识。
 * @param aiRequest 调用 AI 服务的请求函数。
 * @param theme 流式 Markdown 预览主题（两个 Renderer 共享）。
 * @param logger 日志实例（两个 Renderer 共享）。
 * @param prompts 自定义操作附带的可选提示词。
 * @param range 覆盖当前选区的可选目标范围。
 */
export function runAIAction(
  view: EditorView,
  action: string,
  aiRequest: AIRequestFn,
  theme: Theme,
  logger: Log,
  prompts?: string,
  range?: { from: number; to: number; text: string },
) {
  const current = view.state.field(aiStateField);
  if (isAILocked(current)) return;

  const target = range ?? getAITargetRange(view);
  const { from, to, text } = target;
  if (!text && action !== "summarize" && action !== "custom") return;

  const genId = allocGenId();
  const controller = new AbortController();

  view.dispatch({
    effects: setAIState.of({
      phase: "generating",
      from,
      to,
      original: text,
      genId,
      action,
      prompts,
      abortController: controller,
    }),
  });

  aiRequest(
    action,
    text,
    prompts,
    (contentDelta, thinkingDelta) => {
      const state = view.state.field(aiStateField);
      if (state.phase !== "generating" || state.genId !== genId) return;

      if (contentDelta || thinkingDelta) {
        view
          .plugin(aiMaskPlugin)
          ?.setStream(contentDelta, thinkingDelta, theme, logger);
      }
    },
    controller.signal,
  )
    .then((result) => {
      const state = view.state.field(aiStateField);
      if (state.phase !== "generating" || state.genId !== genId) return;
      enterDiffPhase(view, from, to, text, result);
    })
    .catch(() => {
      const state = view.state.field(aiStateField);
      if (state.phase !== "generating" || state.genId !== genId) return;
      view.dispatch({ effects: setAIState.of(IDLE_STATE) });
    });
}
