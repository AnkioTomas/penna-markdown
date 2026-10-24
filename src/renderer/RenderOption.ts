import { Theme } from "@/theme/Theme";
import {
  BaseBlockParser,
  BaseInlineParser,
  SyntaxOptions,
} from "@/transformer/core/ParserBase";
import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";

import type { GraphEngines } from "@/renderer/graph/engines";

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
   * 外部图表库。配置的项由本地库渲染、不再请求远程 API；未配置的仍走远程。
   * 每项可为库实例、加载函数（如 `() => import("mermaid")`）或 `"global"`。
   */
  engines?: GraphEngines;
}
