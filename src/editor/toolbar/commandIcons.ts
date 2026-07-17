const ICON_SIZE = 18;

/** 将 SVG path 包装为统一尺寸的工具栏图标。 */
export function svg(path: string): string {
  return `<svg viewBox="0 0 24 24" width="${ICON_SIZE}" height="${ICON_SIZE}" class="penna-toolbar-icon" aria-hidden="true"><path fill="currentColor" d="${path}"/></svg>`;
}

export const ICON_BOLD = svg(
  "M7 5h6.5a3.5 3.5 0 0 1 2.45 6.05A4 4 0 0 1 18 18H7V5zm4 7h2.5a1.5 1.5 0 0 0 0-3H11v3zm0 7h3.5a2 2 0 0 0 0-4H11v4z",
);
export const ICON_HIGHLIGHT = svg(
  "M17.66 7.93 12 2.27 6.34 7.93c-3.12 3.12-3.12 8.19 0 11.31C7.9 20.8 9.95 21.58 12 21.58s4.1-.78 5.66-2.34c3.12-3.12 3.12-8.19 0-11.31zM12 19.59c-1.6 0-3.11-.62-4.24-1.76C6.62 16.69 6 15.19 6 13.59s.62-3.11 1.76-4.24L12 5.1l4.24 4.25c1.14 1.13 1.76 2.64 1.76 4.24s-.62 3.11-1.76 4.24C15.11 18.97 13.6 19.59 12 19.59z",
);
export const ICON_STRUCTURE = svg(
  "M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 4h8v4h-8v-4z",
);
export const ICON_HEADING = svg("M5 5v14h3v-5h5v5h3V5h-3v6h-5V5H5z");
export const ICON_TASK = svg(
  "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
);
export const ICON_CODEBLOCK = svg(
  "M4 6h16v12H4V6zm2 2v8h12V8H6zm2 2h8v2H8v-2zm0 3h5v2H8v-2z",
);
export const ICON_PLUS = svg("M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z");
export const ICON_LINK = svg(
  "M3.9 12a5 5 0 0 1 1.46-3.54l2.12-2.12a5 5 0 0 1 7.07 7.07l-1.06 1.06-1.41-1.41 1.06-1.06a3 3 0 1 0-4.24-4.24L7.05 9.88A3 3 0 1 0 9.9 14.1l1.41-1.41 1.42 1.41-1.41 1.41A5 5 0 0 1 3.9 12zm7.78-1.06 1.41-1.41 1.42 1.41-1.41 1.41a3 3 0 1 0 4.24 4.24l2.12-2.12a3 3 0 0 0-4.24-4.24l-1.06 1.06-1.41-1.41 1.06-1.06a5 5 0 0 1 7.07 7.07l-2.12 2.12a5 5 0 0 1-7.07-7.07z",
);
export const ICON_VIDEO = svg(
  "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z",
);
export const ICON_FOOTNOTE = svg(
  "M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V12h1c.83 0 1.5-.67 1.5-1.5S9.83 9 9 9H4zm11.5 0H14v6h1.5c.83 0 1.5-.67 1.5-1.5v-3c0-.83-.67-1.5-1.5-1.5z",
);
export const ICON_BLOCKS = svg(
  "M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z",
);
export const ICON_ALERT = svg(
  "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
);
export const ICON_CONTAINER = svg(
  "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z",
);
export const ICON_COLLAPSE = svg(
  "M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
);
export const ICON_TIMELINE = svg(
  "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z",
);
export const ICON_CARD = svg(
  "M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4V6h16v12z",
);
export const ICON_FIELD = svg("M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z");
export const ICON_EXT = svg(
  "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9h-2V7h-2v5H6v2h2v5h2v-5h2v-2zm4 5h-2V7h2v10z",
);
export const ICON_MERMAID = svg(
  "M3 3v8h8V3H3zm10 0v8h8V3h-8zM3 13v8h8v-8H3zm10 0v8h8v-8h-8z",
);
export const ICON_ECHARTS = svg(
  "M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99l1.5 1.5z",
);
export const ICON_FRONTMATTER = svg(
  "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
);
export const ICON_ITALIC = svg("M10 5h9v2h-3.5l-4 10H16v2H7v-2h3.5l4-10H10V5z");
export const ICON_STRIKE = svg(
  "M4 12h16v2H4v-2zm4-3c0-2 1.5-3 4-3s4 1 4 3c0 1.2-.7 2-2 2.5L8 15h8v2H6l4-5.5C8.2 10.8 8 10 8 9z",
);
export const ICON_CODE = svg(
  "M8.5 7 4 12l4.5 5 1.5-1.5L7 12l3-3L8.5 7zm7 0-1.5 1.5L17 12l-3 3 1.5 1.5L20 12l-4.5-5z",
);
export const ICON_SPOILER = svg(
  "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
);
export const ICON_SUP = svg("M16 7h6v2h-4v5h-2V9H8V7h8zM5 19h14v2H5v-2z");
export const ICON_SUB = svg("M16 17h6v2h-4V9h-2v8H8v2h8zM5 3h14v2H5V3z");
export const ICON_COMMENT = svg(
  "M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z",
);
export const ICON_ATTR = svg(
  "M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z",
);
export const ICON_MATH = svg("M7 5h2l3.5 9L16 5h2l-4.5 14h-2L7 5z");
export const ICON_LIST = svg(
  "M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2zM8 7h12v2H8V7zm0 5h12v2H8v-2zm0 5h12v2H8v-2z",
);
export const ICON_OLIST = svg(
  "M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z",
);
export const ICON_QUOTE = svg(
  "M7 7h3v7H6l-1 3V9a2 2 0 0 1 2-2zm8 0h3v7h-4l-1 3V9a2 2 0 0 1 2-2z",
);
export const ICON_HR = svg("M4 11h16v2H4v-2z");
export const ICON_IMAGE = svg(
  "M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 2v10h14V7H5zm2 2h2v2H7V9zm8.5 1.5 3.5 4.5H9l3-3 2 2 1.5-3.5z",
);
export const ICON_TABLE = svg(
  "M4 4h16v16H4V4zm2 2v4h4V6H6zm6 0v4h6V6h-6zM6 12v4h4v-4H6zm6 0v4h6v-4h-6z",
);
export const ICON_AUDIO = svg(
  "M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z",
);
export const ICON_IFRAME = svg(
  "M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9 8h2v8H9V8zm4 2h2v6h-2v-6z",
);
export const ICON_EMOJI = svg(
  "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z",
);
export const ICON_BADGE = svg(
  "M12 2 4 5v6c0 5.25 3.4 10.15 8 11 4.6-.85 8-5.75 8-11V5l-8-3zm0 2.2 6 2.25V11c0 4.2-2.7 8.1-6 8.95C8.7 19.1 6 15.2 6 11V6.45l6-2.25z",
);
export const ICON_GRID = svg(
  "M3 3v8h8V3H3zm10 0v8h8V3h-8zM3 13v8h8v-8H3zm10 0v8h8v-8h-8z",
);
export const ICON_REPO = svg(
  "M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 6.8c.85.004 1.71.115 2.51.337 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.68.92.68 1.85v2.74c0 .27.16.59.67.5A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10z",
);
export const ICON_TABS = svg("M4 6h16v2H4V6zm0 5h10v2H4v-2zm0 5h16v2H4v-2z");
export const ICON_STEPS = svg(
  "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
);

export const ICON_THEME = svg(
  "M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
);
export const ICON_MORE = svg("M6 10h2v2H6v-2zm5 0h2v2h-2v-2zm5 0h2v2h-2v-2z");

export const ICON_AI = svg(
  "M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5",
);
export const ICON_AI_POLISH = svg(
  "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z",
);
export const ICON_AI_TRANSLATE = svg(
  "M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z",
);
export const ICON_AI_SUMMARIZE = svg(
  "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
);
export const ICON_AI_PROOFREAD = svg(
  "M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z",
);
export const ICON_AI_CUSTOM = svg(
  "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z",
);

const AI_ITEM_ICONS: Record<string, string> = {
  "ai-polish": ICON_AI_POLISH,
  "ai-proofread": ICON_AI_PROOFREAD,
  "ai-translate": ICON_AI_TRANSLATE,
  "ai-summarize": ICON_AI_SUMMARIZE,
  "ai-custom": ICON_AI_CUSTOM,
};

/** 工具栏项 id → 默认图标，未显式配置 icon 时按 id 回退 */
export const ITEM_ICONS: Record<string, string> = {
  textFormat: ICON_BOLD,
  highlightMenu: ICON_HIGHLIGHT,
  structure: ICON_STRUCTURE,
  heading: ICON_HEADING,
  taskListMenu: ICON_TASK,
  codeBlockMenu: ICON_CODEBLOCK,
  insert: ICON_PLUS,
  linkRefMenu: ICON_LINK,
  media: ICON_VIDEO,
  footnoteMenu: ICON_FOOTNOTE,
  components: ICON_BLOCKS,
  alertMenu: ICON_ALERT,
  containerMenu: ICON_CONTAINER,
  collapseMenu: ICON_COLLAPSE,
  collapseDefault: ICON_COLLAPSE,
  collapseExpanded: ICON_COLLAPSE,
  collapseExpand: ICON_COLLAPSE,
  timelineMenu: ICON_TIMELINE,
  timelineContainer: ICON_TIMELINE,
  timelineNode: ICON_TIMELINE,
  cards: ICON_CARD,
  fields: ICON_FIELD,
  mermaid: ICON_MERMAID,
  echarts: ICON_ECHARTS,
  frontmatterMenu: ICON_FRONTMATTER,
  ai: ICON_AI,
  ...AI_ITEM_ICONS,
  themeMenu: ICON_THEME,
};

/** 命令 → 默认图标，菜单项未显式配置 icon 时使用 */
export const COMMAND_ICONS: Record<string, string> = {
  bold: ICON_BOLD,
  italic: ICON_ITALIC,
  strikethrough: ICON_STRIKE,
  code: ICON_CODE,
  highlight: ICON_HIGHLIGHT,
  spoiler: ICON_SPOILER,
  sup: ICON_SUP,
  sub: ICON_SUB,
  comment: ICON_COMMENT,
  htmlAttr: ICON_ATTR,
  math: ICON_MATH,
  heading1: ICON_HEADING,
  heading2: ICON_HEADING,
  heading3: ICON_HEADING,
  heading4: ICON_HEADING,
  heading5: ICON_HEADING,
  heading6: ICON_HEADING,
  blockquote: ICON_QUOTE,
  unorderedList: ICON_LIST,
  orderedList: ICON_OLIST,
  taskList: ICON_TASK,
  taskInProgress: ICON_TASK,
  taskDeferred: ICON_TASK,
  taskEarly: ICON_TASK,
  taskCancelled: ICON_TASK,
  taskUrgent: ICON_TASK,
  link: ICON_LINK,
  image: ICON_IMAGE,
  table: ICON_TABLE,
  video: ICON_VIDEO,
  audio: ICON_AUDIO,
  iframe: ICON_IFRAME,
  emoji: ICON_EMOJI,
  badge: ICON_BADGE,
  footnoteRef: ICON_FOOTNOTE,
  footnoteDef: ICON_FOOTNOTE,
  card: ICON_CARD,
  linkCard: ICON_LINK,
  imageCard: ICON_IMAGE,
  repoCard: ICON_REPO,
  cardGrid: ICON_GRID,
  cardMasonry: ICON_GRID,
  field: ICON_FIELD,
  fieldGroup: ICON_FIELD,
  alert: ICON_ALERT,
  container: ICON_CONTAINER,
  collapse: ICON_COLLAPSE,
  tabs: ICON_TABS,
  steps: ICON_STEPS,
  timeline: ICON_TIMELINE,
  mathBlock: ICON_MATH,
  mermaid: ICON_MERMAID,
  echarts: ICON_ECHARTS,
  enhancedCode: ICON_CODEBLOCK,
  frontmatter: ICON_FRONTMATTER,
  codeBlock: ICON_CODEBLOCK,
  horizontalRule: ICON_HR,
  setTheme: ICON_THEME,
  footnote: ICON_FOOTNOTE,
};

/** 解析命令应使用的默认工具栏图标。 */
export function resolveCommandIcon(command?: string): string {
  if (command && COMMAND_ICONS[command]) return COMMAND_ICONS[command];
  return ICON_EXT;
}

/** 解析工具栏项最终展示的图标。 */
export function resolveToolbarIcon(item: {
  id: string;
  icon?: string;
}): string {
  if (item.icon) return item.icon;
  if (ITEM_ICONS[item.id]) return ITEM_ICONS[item.id];
  if (item.id.startsWith("theme-")) return ICON_THEME;
  if (item.id.startsWith("ai-")) return ICON_AI;
  return resolveCommandIcon(item.id);
}
