import type { EditorView } from "@codemirror/view";
import type { EventBus } from "@/core/event/EventBus";
import type { Theme } from "@/theme/Theme";
import type { Log } from "@/core/Log";
import type {
  OnAiRequest,
  OnAiRequestCancel,
} from "@/editor/editor/EditorOptions";
import { runCommand } from "@/editor/commands";
import type { ParserStore } from "@/transformer/core/ParserStore";
import type { EditorCommandPayload } from "@/editor/events";

export class CommandBridge {
  private readonly offs: (() => void)[] = [];

  /**
   * 订阅命令事件，并将其转发给底层命令执行器。
   *
   * @param eventBus 负责接收编辑器命令事件的事件总线。
   * @param theme 当前编辑器使用的主题实例。
   * @param logger 日志实例，与 AI renderer 共享。
   * @param getView 延迟取得当前 CodeMirror 视图的函数。
   * @param getStore 延迟取得最近一次预览解析存储的可选函数。
   * @param onAiRequest 可选的 AI 请求回调。
   * @param onAiRequestCancel 可选的 AI 取消请求回调。
   */
  constructor(
    private readonly eventBus: EventBus,
    private readonly theme: Theme,
    private readonly logger: Log,
    private readonly getView: () => EditorView,
    private readonly getStore?: () => ParserStore | null,
    private readonly onAiRequest?: OnAiRequest,
    private readonly onAiRequestCancel?: OnAiRequestCancel,
  ) {
    this.offs.push(
      eventBus.on<EditorCommandPayload>("editor:command", (payload) => {
        void runCommand(this.getView(), payload.command, payload.payload, {
          eventBus: this.eventBus,
          theme: this.theme,
          logger: this.logger,
          getStore: this.getStore,
          onAiRequest: this.onAiRequest,
          onAiRequestCancel: this.onAiRequestCancel,
        });
      }),
    );
  }

  /** 注销命令事件订阅并释放持有的清理函数。 */
  destroy(): void {
    for (const off of this.offs) off();
    this.offs.length = 0;
  }
}
