/**
 * @file 块级语法拓展：仓库卡片
 * @module transformer/extends/block/card/repoCard
 *
 * ```
 * ::: repo-card vuepress/ecosystem
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
  parseRepoCardOpen,
  readTripleColonBlock,
} from "./shared.js";

const OPEN_RE = /^ {0,3}:::(?!:)\s+repo-card(?:\s+(.*))?\s*$/;

/** shields.io 路径与链接配置（配色全部使用 shields 原生默认值） */
const SHIELD_METRICS = {
  language: {
    path: "languages/top",
    label: "Primary language",
    link: (repoBase) => `${repoBase}/graphs/languages`,
  },
  stars: {
    path: "stars",
    label: "Stars",
    link: (repoBase) => `${repoBase}/stargazers`,
  },
  forks: {
    path: "forks",
    label: "Forks",
    link: (repoBase) => `${repoBase}/forks`,
  },
  license: {
    path: "license",
    label: "License",
    link: (repoBase) => `${repoBase}#readme`,
  },
};

/**
 * @param {string} repo
 * @param {keyof typeof SHIELD_METRICS} metric
 * @returns {string}
 */
function shieldsRepoBadge(repo, metric) {
  const config = SHIELD_METRICS[metric];
  const slug = encodeURIComponent(repo);
  return `https://img.shields.io/github/${config.path}/${slug}?style=flat`;
}

/**
 * @param {string} repo
 * @param {keyof typeof SHIELD_METRICS} metric
 * @param {string} repoBase
 * @returns {string}
 */
function renderRepoShield(repo, metric, repoBase) {
  const config = SHIELD_METRICS[metric];
  const src = shieldsRepoBadge(repo, metric);
  const alt = escapeHtml(config.label);
  const href = escapeHtml(config.link(repoBase));
  return [
    `<a class="cherry-repo-card__shield cherry-repo-card__shield--${metric}" href="${href}" target="_blank" rel="noopener noreferrer" title="${alt}">`,
    `<img class="cherry-repo-card__shield-img" src="${escapeHtml(src)}" alt="${alt}" loading="lazy">`,
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

    const { repo, link, visibility } = parseRepoCardOpen(block.attrs);
    if (!repo) return null;

    return {
      node: createNode(this.type, {
        repo,
        link,
        visibility,
        children: ctx.parseBlocks(normalizeInnerLines(block.innerLines)),
      }),
      nextIndex: block.nextIndex,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const repo = String(node.repo ?? "");
    const href =
      String(node.link ?? "") || (repo ? `https://github.com/${repo}` : "");
    const repoBase = repo ? `https://github.com/${repo}` : "";
    const visibility = String(node.visibility ?? "Public");
    const bodyHtml = ctx.renderBlock(node.children ?? []);

    const descHtml = bodyHtml.trim()
      ? `<div class="cherry-repo-card__desc">${bodyHtml}</div>`
      : "";

    const parts = [`<div class="cherry-repo-card">`];

    parts.push(`<p class="cherry-repo-card__name">`);
    parts.push(`<span class="cherry-repo-card__icon" aria-hidden="true"></span>`);
    if (href && repo) {
      parts.push(
        `<span class="cherry-repo-card__link"><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(repo)}">${escapeHtml(repo)}</a></span>`,
      );
    } else if (repo) {
      parts.push(`<span class="cherry-repo-card__link">${escapeHtml(repo)}</span>`);
    }
    if (visibility) {
      parts.push(`<span class="cherry-repo-card__visibility">${escapeHtml(visibility)}</span>`);
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
      parts.push(`<div class="cherry-repo-card__info">${info.join("")}</div>`);
    }

    parts.push(`</div>`);
    return parts.join("\n");
  }
}

export const repoCardBlockParser = new RepoCardBlockParser();
