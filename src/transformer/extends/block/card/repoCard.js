/**
 * @file 块级语法拓展：仓库卡片
 * @module transformer/extends/block/card/repoCard
 *
 * ```
 * ::: repo-card repo="vuepress/ecosystem"
 * Official plugins and themes for VuePress2
 * :::
 * ```
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import {
  CARD_BLOCK_PRIORITY,
  parseTitleInline,
  pickAttr,
  readTripleColonBlock,
} from "./shared.js";

const OPEN_RE = /^ {0,3}:::(?!:)\s+repo-card(?:\s+(.*))?\s*$/;

/** shields.io 路径与链接配置 */
const SHIELD_METRICS = {
  language: {
    path: "languages/top",
    label: "Primary language",
    link: (repoBase) => `${repoBase}/graphs/languages`,
    logo: "",
  },
  stars: {
    path: "stars",
    label: "GitHub stars",
    link: (repoBase) => `${repoBase}/stargazers`,
    logo: "star",
  },
  forks: {
    path: "forks",
    label: "GitHub forks",
    link: (repoBase) => `${repoBase}/forks`,
    logo: "git-fork",
  },
  license: {
    path: "license",
    label: "GitHub license",
    link: (repoBase) => `${repoBase}#readme`,
    logo: "law",
  },
};

/** @type {Record<string, { labelColor: string; color: string; logoColor: string }>} */
const SHIELD_PALETTES = {
  light: {
    labelColor: "f3f4f6",
    color: "57606a",
    logoColor: "57606a",
  },
  dark: {
    labelColor: "21262d",
    color: "8b949e",
    logoColor: "8b949e",
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
 * @param {string} repo
 * @param {string} path
 * @param {string} logo
 * @param {"light" | "dark"} theme
 * @returns {string}
 */
function shieldsRepoBadge(repo, path, logo, theme) {
  const slug = encodeURIComponent(repo);
  const palette = SHIELD_PALETTES[theme];
  const params = new URLSearchParams({
    style: "flat",
    labelColor: palette.labelColor,
    color: palette.color,
    logoColor: palette.logoColor,
    logoWidth: "12",
  });
  if (logo) params.set("logo", logo);
  return `https://img.shields.io/github/${path}/${slug}?${params}`;
}

/**
 * @param {string} repo
 * @param {keyof typeof SHIELD_METRICS} metric
 * @param {string} repoBase
 * @returns {string}
 */
function renderRepoShield(repo, metric, repoBase) {
  const config = SHIELD_METRICS[metric];
  const light = shieldsRepoBadge(repo, config.path, config.logo, "light");
  const dark = shieldsRepoBadge(repo, config.path, config.logo, "dark");
  const alt = escapeHtml(config.label);
  const href = escapeHtml(config.link(repoBase));

  return [
    `<a class="repo-shield" href="${href}" target="_blank" rel="noopener noreferrer" title="${alt}">`,
    `<img class="repo-shield__img repo-shield__img--light" src="${escapeHtml(light)}" alt="${alt}" loading="lazy">`,
    `<img class="repo-shield__img repo-shield__img--dark" src="${escapeHtml(dark)}" alt="${alt}" loading="lazy">`,
    `</a>`,
  ].join("");
}

class RepoCardBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "repo_card", priority: CARD_BLOCK_PRIORITY });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const block = readTripleColonBlock(lines, index, OPEN_RE);
    if (!block) return null;

    const { title, titleNodes } = parseTitleInline(block.attrs, ctx);

    return {
      node: createNode(this.type, {
        title,
        titleNodes,
        link: pickAttr(block.attrs, "link") || pickAttr(block.attrs, "href"),
        repo: parseRepoSlug(block.attrs),
        visibility: pickAttr(block.attrs, "visibility") || "Public",
        children: ctx.parseBlocks(normalizeInnerLines(block.innerLines)),
      }),
      nextIndex: block.nextIndex,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const repo = String(node.repo ?? "");
    const title = String(node.title ?? "");
    const titleNodes = node.titleNodes ?? [];
    const hasTitle = Boolean(title);
    const nameHtml = hasTitle
      ? ctx.renderInline(titleNodes)
      : escapeHtml(repo);
    const nameLabel = hasTitle ? title : repo;
    const href =
      String(node.link ?? "") || (repo ? `https://github.com/${repo}` : "");
    const repoBase = repo ? `https://github.com/${repo}` : "";
    const visibility = String(node.visibility ?? "Public");
    const bodyHtml = ctx.renderBlock(node.children ?? []);

    const descHtml = bodyHtml.trim()
      ? `<div class="repo-desc">${bodyHtml}</div>`
      : "";

    const parts = [`<div class="repo-card">`];

    parts.push(`<p class="repo-name">`);
    parts.push(`<span class="repo-icon" aria-hidden="true"></span>`);
    if (href && (hasTitle || repo)) {
      parts.push(
        `<span class="repo-link"><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(nameLabel)}">${nameHtml}</a></span>`,
      );
    } else if (hasTitle || repo) {
      parts.push(`<span class="repo-link">${nameHtml}</span>`);
    }
    if (visibility) {
      parts.push(`<span class="repo-visibility">${escapeHtml(visibility)}</span>`);
    }
    parts.push(`</p>`);

    if (descHtml) {
      parts.push(descHtml);
    }

    if (repo) {
      const info = [
        renderRepoShield(repo, "language", repoBase),
        renderRepoShield(repo, "stars", repoBase),
        renderRepoShield(repo, "forks", repoBase),
        renderRepoShield(repo, "license", repoBase),
      ];
      parts.push(`<div class="repo-info">${info.join("\n")}</div>`);
    }

    parts.push(`</div>`);
    return parts.join("\n");
  }
}

export const repoCardBlockParser = new RepoCardBlockParser();
