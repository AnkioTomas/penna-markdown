import { Theme } from "@/theme/Theme";
import {
  BaseBlockParser,
  BaseInlineParser,
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
}
