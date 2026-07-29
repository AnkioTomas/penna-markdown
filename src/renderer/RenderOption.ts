import { Theme } from "@/theme/Theme";
import {
  BaseBlockParser,
  BaseInlineParser,
  SyntaxOptions,
} from "@/transformer/core/ParserBase";
import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";

export interface RenderOption {
  mount: HTMLElement;
  theme: Theme;
  eventBus: EventBus;
  logger: Log;
  inlineParsers?: Record<number, BaseInlineParser>;
  blockParsers?: Record<number, BaseBlockParser>;
  /** 按 parser key 覆盖内置语法配置，逐 key 合并到渲染器默认值之上 */
  syntaxOptions?: SyntaxOptions;
}
