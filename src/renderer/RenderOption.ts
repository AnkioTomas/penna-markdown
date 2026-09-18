import { Theme } from "@/theme/Theme";
import {
  BaseBlockParser,
  BaseInlineParser,
  SyntaxOptions,
} from "@/transformer/core/ParserBase";
import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";
import type { GraphEngines } from "@/renderer/graph/graph";

export interface RenderOption {
  mount: HTMLElement;
  theme: Theme;
  eventBus: EventBus;
  logger: Log;
  inlineParsers?: Record<number, BaseInlineParser>;
  blockParsers?: Record<number, BaseBlockParser>;
  /** 按 parser key 覆盖内置语法配置，逐 key 合并到渲染器默认值之上 */
  syntaxOptions?: SyntaxOptions;
  /**
   * 本地图表引擎。传入后对应语法不再请求远程 API，由 Renderer 水合。
   * 例：`{ math: katex, mermaid, echarts }`（宿主自行 import / CDN 挂到变量）。
   */
  engines?: GraphEngines;
}
