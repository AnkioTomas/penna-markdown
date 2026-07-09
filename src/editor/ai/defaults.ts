import type { CherryAIItem } from "@/editor/CherryOptions";

const ICON_SIZE = 18;

function svg(path: string): string {
  return `<svg viewBox="0 0 24 24" width="${ICON_SIZE}" height="${ICON_SIZE}" class="cherry-ai-icon" aria-hidden="true"><path fill="currentColor" d="${path}"/></svg>`;
}

export const ICON_AI_TRANSLATE = svg(
  "M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z",
);

export const ICON_AI_CONTINUE = svg(
  "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
);

export const ICON_AI_POLISH = svg(
  "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z",
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
  isCustom: boolean;
}

const BUILTIN_DEFAULTS: Record<
  string,
  { label: string; icon: string; isCustom?: boolean }
> = {
  translate: { label: "翻译", icon: ICON_AI_TRANSLATE },
  continue: { label: "续写", icon: ICON_AI_CONTINUE },
  polish: { label: "润色", icon: ICON_AI_POLISH },
  custom: { label: "自定义", icon: ICON_AI_CUSTOM, isCustom: true },
};

const DEFAULT_ITEM_IDS = ["translate", "continue", "polish", "custom"] as const;

export function resolveAIItems(items?: CherryAIItem[]): ResolvedAIItem[] {
  const source = items ?? DEFAULT_ITEM_IDS.map((id) => ({ id }));

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
