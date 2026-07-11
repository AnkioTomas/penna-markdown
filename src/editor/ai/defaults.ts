import type { CherryAIItem } from "@/editor/CherryOptions";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import type { ToolbarItem } from "@/editor/toolbar/ToolbarItem";

const ICON_SIZE = 18;

function svg(path: string): string {
  return `<svg viewBox="0 0 24 24" width="${ICON_SIZE}" height="${ICON_SIZE}" class="cherry-ai-icon" aria-hidden="true"><path fill="currentColor" d="${path}"/></svg>`;
}

export const ICON_AI = svg(
  "M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5",
);

export const ICON_AI_POLISH = svg(
  "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z",
);

export const ICON_AI_SHORTEN = svg(
  "M5 16h3v2H5v-2zm6.5 0H19v2h-7.5v-2zM5 12h8v2H5v-2zm10 0h4v2h-4v-2zM5 8h14v2H5V8z",
);

export const ICON_AI_EXPAND = svg("M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z");

export const ICON_AI_TRANSLATE = svg(
  "M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z",
);

export const ICON_AI_SUMMARIZE = svg(
  "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
);

export const ICON_AI_REWRITE = svg(
  "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
);

export const ICON_AI_KEY_POINTS = svg(
  "M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2zm4-8h12v2H8V8zm0 5h12v2H8v-2zm0 5h8v2H8v-2z",
);

export const ICON_AI_TONE = svg("M12 3v10.55A4 4 0 1 0 14 17.32V7h4V3h-6z");

export const ICON_AI_EXPLAIN = svg(
  "M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z",
);

export const ICON_AI_PROOFREAD = svg(
  "M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z",
);

export const ICON_AI_CUSTOM = svg(
  "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z",
);

export const ICON_AI_ACCEPT = svg(
  "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
);

export const ICON_AI_REJECT = svg(
  "M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z",
);

export interface ResolvedAIItem {
  id: string;
  label: string;
  icon: string;
  isCustom?: boolean;
}

const BUILTIN_DEFAULTS: Record<
  string,
  { label: string; icon: string; isCustom?: boolean }
> = {
  polish: { label: "智能润色", icon: ICON_AI_POLISH },
  shorten: { label: "精简压缩", icon: ICON_AI_SHORTEN },
  expand: { label: "内容扩写", icon: ICON_AI_EXPAND },
  translate: { label: "翻译文本", icon: ICON_AI_TRANSLATE },
  summarize: { label: "生成摘要", icon: ICON_AI_SUMMARIZE },
  rewrite: { label: "换个写法", icon: ICON_AI_REWRITE },
  keyPoints: { label: "提取要点", icon: ICON_AI_KEY_POINTS },
  tone: { label: "调整语气", icon: ICON_AI_TONE },
  explain: { label: "解释说明", icon: ICON_AI_EXPLAIN },
  proofread: { label: "纠错校对", icon: ICON_AI_PROOFREAD },
  custom: { label: "自定义", icon: ICON_AI_CUSTOM, isCustom: true },
};

export const DEFAULT_AI_ACTION_IDS = [
  "polish",
  "shorten",
  "expand",
  "translate",
  "summarize",
  "rewrite",
  "keyPoints",
  "tone",
  "explain",
  "proofread",
  "custom",
] as const;

export function resolveAIToolbarItems(
  items?: CherryAIItem[],
): ResolvedAIItem[] {
  const source = items ?? DEFAULT_AI_ACTION_IDS.map((id) => ({ id }));

  return source.map((item) => {
    const builtin = BUILTIN_DEFAULTS[item.id];
    const label = item.label ?? builtin?.label;
    const icon = item.icon ?? builtin?.icon;
    if (!label || !icon) {
      throw new Error(
        `Cherry AI item "${item.id}" requires explicit label and icon`,
      );
    }
    return {
      id: item.id,
      label,
      icon,
      isCustom: builtin?.isCustom ?? item.id === "custom",
    };
  });
}

export function buildAIToolbarItems(items?: CherryAIItem[]): ToolbarItem[] {
  const resolved = resolveAIToolbarItems(items);

  return [
    {
      id: "ai",
      type: "menu",
      label: "AI",
      title: "AI 助手",
      icon: ICON_AI,
      children: resolved.map((item) => ({
        id: `ai-${item.id}`,
        type: "button" as const,
        label: item.label,
        title: item.label,
        icon: item.icon,
        onClick: async (ctx) => {
          if (item.isCustom) {
            const result = await requestDialog(ctx.eventBus, "aiCustom");
            if (!result?.prompts) return;
            ctx.execute("ai", { action: item.id, prompts: result.prompts });
            return;
          }
          ctx.execute("ai", { action: item.id });
        },
      })),
    },
  ];
}
