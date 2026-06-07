/**
 * @file Cherry 卡片代码块解析与渲染
 * @module transformer/extends/utils/cherryCard
 *
 * 支持 ```card 围栏代码块，可解析 Markdown 行格式或 JSON 格式，
 * 渲染为 list / image 两种布局的卡片网格 HTML。
 */

import { escapeHtml } from "@/transformer/utils/escape.js";

/**
 * 卡片默认配色轮盘（背景色与文字色成对）。
 *
 * @type {Array<{ bg: string, text: string }>}
 */
const CARD_COLORS = [
  { bg: "#34495E", text: "#BDC3C7" },
  { bg: "#16A085", text: "#A3E4D7" },
  { bg: "#27AE60", text: "#A9DFBF" },
  { bg: "#2980B9", text: "#AED6F1" },
  { bg: "#8E44AD", text: "#D2B4DE" },
  { bg: "#2C3E50", text: "#ECF0F1" },
];

/**
 * 单行卡片 Markdown 语法正则。
 *
 * 匹配可选封面图 `![alt](url)`、标题链接 `[title](link)` 与可选描述文本。
 *
 * @type {RegExp}
 */
const CARD_LINE_RE =
  /(?:!\[(.*?)\]\((.*?)\))?\s*\[(.*?)\]\((.*?)\)(?:\s+(.*))?/;

/**
 * @typedef {{
 *   title: string,
 *   desc: string,
 *   image: string,
 *   link: string,
 *   bgColor: string,
 *   textColor: string
 * }} CardItem
 */

/**
 * @typedef {{
 *   type: 'list' | 'image',
 *   count: number | 'auto',
 *   data: CardItem[]
 * }} CardData
 */

/**
 * 按索引从配色轮盘取色（循环使用）。
 *
 * @param {number} index
 * @returns {{ bg: string, text: string }}
 */
function colorAt(index) {
  return CARD_COLORS[index % CARD_COLORS.length];
}

/**
 * 将 Markdown 行格式卡片内容解析为结构化数据。
 *
 * 首行可选 `#type/count` 头（如 `#list/3`），后续每行一条卡片项。
 *
 * @param {string} text
 * @returns {CardData}
 */
function parseCardLines(text) {
  const lines = text.trim().split("\n");
  const result = {
    type: "list",
    count: "auto",
    data: [],
  };

  if (lines[0]?.startsWith("#")) {
    const header = lines[0].slice(1);
    const [type, count] = header.split("/");
    result.type = type || "list";
    result.count = count ? Number.parseInt(count, 10) : "auto";
    lines.shift();
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const match = line.match(CARD_LINE_RE);
    if (!match) continue;
    result.data.push({
      title: match[3] || "",
      desc: match[5] || "",
      image: match[2] || "",
      link: match[4] || "",
      bgColor: "",
      textColor: "",
    });
  }

  return result;
}

/**
 * 将 JSON 格式卡片内容解析为结构化数据。
 *
 * @param {string} text
 * @returns {CardData | null} 解析失败或非数组 data 时返回 null
 */
function parseCardJson(text) {
  try {
    const json = JSON.parse(text.trim());
    if (!json || !Array.isArray(json.data)) return null;
    return {
      type: json.type === "image" ? "image" : "list",
      count: json.count ?? "auto",
      data: json.data.map((item) => ({
        title: item.title || "",
        desc: item.desc || "",
        image: item.image || item.img || "",
        link: item.link || "",
        bgColor: item.bgColor || "",
        textColor: item.textColor || "",
      })),
    };
  } catch {
    return null;
  }
}

/**
 * 解析卡片代码块内容（自动识别 JSON 或 Markdown 行格式）。
 *
 * @param {string} src - 代码块原始文本
 * @returns {CardData}
 */
export function parseCardContent(src) {
  const trimmed = src.trim();
  if (trimmed.startsWith("{")) {
    return parseCardJson(trimmed) ?? parseCardLines(trimmed);
  }
  return parseCardLines(trimmed);
}

/**
 * 将列数配置规范为 1–4 的有效值。
 *
 * @param {number | 'auto'} count
 * @param {number} size - 卡片项数量
 * @returns {number}
 */
function resolveRow(count, size) {
  let row = count;
  if (row === "auto" || Number.isNaN(row)) {
    row = Math.min(3, size) || 1;
  }
  if (!row || row > 4 || row < 1) row = 3;
  return row;
}

/**
 * 渲染 list 布局下的单张卡片 HTML。
 *
 * @param {CardItem} item
 * @param {number} row - 每行列数（用于 CSS 类名）
 * @param {number} index - 项索引，用于默认配色
 * @returns {string}
 */
function renderListItem(item, row, index) {
  const palette = colorAt(index);
  const bgColor = item.bgColor || palette.bg;
  const textColor = item.textColor || palette.text;
  const tag = item.link ? "a" : "span";
  const href =
    item.link && tag === "a"
      ? ` href="${escapeHtml(item.link)}" target="_blank"`
      : "";
  const image = item.image
    ? `<img src="${escapeHtml(item.image)}" class="cherry-card-image" alt="">`
    : "";

  return `<${tag}${href} class="cherry-card-item cherry-card-row-${row}" style="padding:0;background-color:${bgColor};color:${textColor};">${image}<div class="cherry-card-body"><p class="cherry-card-title">${escapeHtml(item.title)}</p><p class="cherry-card-desc">${escapeHtml(item.desc)}</p></div></${tag}>`;
}

/**
 * 渲染 image 布局下的单张卡片 HTML。
 *
 * @param {CardItem} item
 * @param {number} row - 每行列数（用于 CSS 类名）
 * @returns {string}
 */
function renderImageItem(item, row) {
  const link = item.link || "#";
  const image = item.image
    ? `<img src="${escapeHtml(item.image)}" class="cherry-card-image" style="object-fit: cover" alt="">`
    : "";
  const desc = item.desc
    ? `<p class="cherry-card-desc">${escapeHtml(item.desc)}</p>`
    : "";

  return `<div class="cherry-card-item cherry-card-row-${row}"><a href="${escapeHtml(link)}" target="_blank"><div class="cherry-card-box-img">${image}</div><div class="cherry-card-box-info"><p class="cherry-card-title">${escapeHtml(item.title)}</p>${desc}</div></a></div>`;
}

/**
 * 将卡片代码块内容渲染为完整 HTML 片段。
 *
 * @param {string} content - 代码块原始文本
 * @returns {string} 成功时返回卡片网格 HTML，语法错误时返回错误提示块
 */
export function renderCardBlock(content) {
  try {
    const json = parseCardContent(content);
    const row = resolveRow(json.count, json.data.length);
    const items =
      json.type === "image"
        ? json.data.map((item) => renderImageItem(item, row))
        : json.data.map((item, index) => renderListItem(item, row, index));

    return `<div data-type="card" class="cherry-card-block"><div class="cherry-card cherry-card-${json.type}-container">${items.join("")}</div></div>`;
  } catch {
    return `<div data-type="card" class="cherry-card-error">卡片语法错误，请检查格式</div>`;
  }
}
