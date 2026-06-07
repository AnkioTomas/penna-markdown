/**
 * Cherry 卡片代码块：```card
 */

import { escapeHtml } from "@/transformer/utils/escape.js";

const CARD_COLORS = [
  { bg: "#34495E", text: "#BDC3C7" },
  { bg: "#16A085", text: "#A3E4D7" },
  { bg: "#27AE60", text: "#A9DFBF" },
  { bg: "#2980B9", text: "#AED6F1" },
  { bg: "#8E44AD", text: "#D2B4DE" },
  { bg: "#2C3E50", text: "#ECF0F1" },
];

const CARD_LINE_RE =
  /(?:!\[(.*?)\]\((.*?)\))?\s*\[(.*?)\]\((.*?)\)(?:\s+(.*))?/;

function colorAt(index) {
  return CARD_COLORS[index % CARD_COLORS.length];
}

/** @param {string} text */
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

/** @param {string} text */
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

/** @param {string} src */
export function parseCardContent(src) {
  const trimmed = src.trim();
  if (trimmed.startsWith("{")) {
    return parseCardJson(trimmed) ?? parseCardLines(trimmed);
  }
  return parseCardLines(trimmed);
}

function resolveRow(count, size) {
  let row = count;
  if (row === "auto" || Number.isNaN(row)) {
    row = Math.min(3, size) || 1;
  }
  if (!row || row > 4 || row < 1) row = 3;
  return row;
}

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

/** @param {string} content */
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
