/**
 * @file 块级语法拓展：仓库卡片
 * @module transformer/extends/block/card/repoCard
 *
 * ```
 * ::: repo-card repo="vuepress/ecosystem" desc="Official plugins..."
 * :::
 * ```
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import {
  CARD_BLOCK_PRIORITY,
  pickAttr,
  readTripleColonBlock,
} from "./shared.js";

const OPEN_RE = /^ {0,3}:::(?!:)\s+repo-card(?:\s+(.*))?\s*$/;

const LANGUAGE_COLORS = {
  typescript: "#3178c6",
  javascript: "#f1e05a",
  python: "#3572a5",
  rust: "#dea584",
  go: "#00add8",
  java: "#b07219",
  vue: "#41b883",
  html: "#e34c26",
  css: "#563d7c",
  shell: "#89e051",
};

/** @type {Record<string, string>} */
const REPO_BADGE_LOGOS = {
  stars: "star",
  forks: "git-fork",
  license: "law",
};

/** @type {Record<string, { labelColor: string; color: string; logoColor: string }>} */
const REPO_BADGE_PALETTES = {
  light: {
    labelColor: "eceff3",
    color: "6e6e73",
    logoColor: "6e6e73",
  },
  dark: {
    labelColor: "262626",
    color: "999999",
    logoColor: "999999",
  },
};

/**
 * @param {string} raw
 * @returns {string}
 */
function parseRepoSlug(raw) {
  const repo = pickAttr(raw, "repo").trim();
  if (repo) return repo;

  const link = pickAttr(raw, "link") || pickAttr(raw, "href");
  const match = link.match(/github\.com\/([^/]+\/[^/#?]+)/i);
  return match?.[1]?.replace(/\.git$/, "") ?? "";
}

/**
 * @param {string} language
 * @param {string} colorAttr
 * @returns {string}
 */
function resolveLanguageColor(language, colorAttr) {
  if (colorAttr) return colorAttr;
  const key = language.trim().toLowerCase();
  return LANGUAGE_COLORS[key] ?? "#8b949e";
}

/**
 * @param {string} repo
 * @param {string} metric
 * @param {"light" | "dark"} theme
 * @returns {string}
 */
function shieldsRepoBadge(repo, metric, theme) {
  const slug = encodeURIComponent(repo);
  const palette = REPO_BADGE_PALETTES[theme];
  const logo = REPO_BADGE_LOGOS[metric] ?? "";
  const params = new URLSearchParams({
    style: "flat",
    labelColor: palette.labelColor,
    color: palette.color,
    logoColor: palette.logoColor,
    logoWidth: "10",
  });
  if (logo) params.set("logo", logo);
  return `https://img.shields.io/github/${metric}/${slug}?${params}`;
}

/**
 * @param {string} repo
 * @param {string} metric
 * @param {string} label
 * @returns {string}
 */
function renderRepoBadgeImg(repo, metric, label) {
  const light = shieldsRepoBadge(repo, metric, "light");
  const dark = shieldsRepoBadge(repo, metric, "dark");
  const alt = escapeHtml(label);
  return `<p class="repo-stat-badge" title="${alt}"><img class="repo-badge repo-badge--light" src="${escapeHtml(light)}" alt="${alt}" loading="lazy"><img class="repo-badge repo-badge--dark" src="${escapeHtml(dark)}" alt="${alt}" loading="lazy"></p>`;
}

/**
 * @param {string} iconClass
 * @param {string} value
 * @param {string} title
 * @returns {string}
 */
function renderRepoStatText(iconClass, value, title) {
  return `<p title="${escapeHtml(title)}"><span class="repo-stat-icon ${iconClass}" aria-hidden="true"></span><span>${escapeHtml(value)}</span></p>`;
}

class RepoCardBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "repo_card", priority: CARD_BLOCK_PRIORITY });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const block = readTripleColonBlock(lines, index, OPEN_RE);
    if (!block) return null;

    return {
      node: createNode(this.type, {
        title: pickAttr(block.attrs, "title"),
        link: pickAttr(block.attrs, "link") || pickAttr(block.attrs, "href"),
        repo: parseRepoSlug(block.attrs),
        description:
          pickAttr(block.attrs, "description") || pickAttr(block.attrs, "desc"),
        visibility: pickAttr(block.attrs, "visibility") || "Public",
        language: pickAttr(block.attrs, "language"),
        languageColor: pickAttr(block.attrs, "language-color"),
        stars: pickAttr(block.attrs, "stars"),
        forks: pickAttr(block.attrs, "forks"),
        license: pickAttr(block.attrs, "license"),
        badges: pickAttr(block.attrs, "badges") !== "false",
        children: ctx.parseBlocks(normalizeInnerLines(block.innerLines)),
      }),
      nextIndex: block.nextIndex,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const repo = String(node.repo ?? "");
    const name = String(node.title ?? "") || repo;
    const href =
      String(node.link ?? "") || (repo ? `https://github.com/${repo}` : "");
    const visibility = String(node.visibility ?? "Public");
    const language = String(node.language ?? "");
    const languageColor = resolveLanguageColor(
      language,
      String(node.languageColor ?? ""),
    );
    const stars = String(node.stars ?? "");
    const forks = String(node.forks ?? "");
    const license = String(node.license ?? "");
    const useBadges = node.badges !== false && Boolean(repo);
    const description = String(node.description ?? "");
    const bodyHtml = ctx.renderBlock(node.children ?? []);

    let descHtml = "";
    if (description) {
      descHtml = `<p class="repo-desc">${escapeHtml(description)}</p>`;
    } else if (bodyHtml.trim()) {
      descHtml = `<div class="repo-desc">${bodyHtml}</div>`;
    }

    const parts = [`<div class="repo-card">`];

    parts.push(`<p class="repo-name">`);
    parts.push(`<span class="repo-icon" aria-hidden="true"></span>`);
    if (href && name) {
      parts.push(
        `<span class="repo-link"><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(name)}">${escapeHtml(name)}</a></span>`,
      );
    } else if (name) {
      parts.push(`<span class="repo-link">${escapeHtml(name)}</span>`);
    }
    if (visibility) {
      parts.push(`<span class="repo-visibility">${escapeHtml(visibility)}</span>`);
    }
    parts.push(`</p>`);

    if (descHtml) {
      parts.push(descHtml);
    }

    const info = [];
    if (language) {
      info.push(
        `<p><span class="repo-language" style="background-color: ${escapeHtml(languageColor)}"></span><span>${escapeHtml(language)}</span></p>`,
      );
    }

    if (useBadges) {
      if (!stars) info.push(renderRepoBadgeImg(repo, "stars", "GitHub stars"));
      if (!forks) info.push(renderRepoBadgeImg(repo, "forks", "GitHub forks"));
      if (!license) info.push(renderRepoBadgeImg(repo, "license", "GitHub license"));
    }

    if (stars) {
      info.push(renderRepoStatText("repo-stat-star", stars, `Github Stars: ${stars}`));
    }
    if (forks) {
      info.push(renderRepoStatText("repo-stat-fork", forks, `Github Forks: ${forks}`));
    }
    if (license) {
      info.push(
        renderRepoStatText("repo-stat-license", license, `Github License: ${license}`),
      );
    }

    if (info.length) {
      parts.push(`<div class="repo-info">${info.join("\n")}</div>`);
    }

    parts.push(`</div>`);
    return parts.join("\n");
  }
}

export const repoCardBlockParser = new RepoCardBlockParser();
