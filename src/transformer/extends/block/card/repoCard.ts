/**
 * @file 块级语法拓展：仓库卡片
 * @module transformer/extends/block/card/repoCard
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import {
  createNode,
  type MarkdownNode,
} from "@/transformer/core/MarkdownNode.js";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import {
  blockLength,
  parseRepoCardOpen,
  readTripleColonBlock,
} from "@/transformer/extends/block/card/shared";

const OPEN_RE = /^ {0,3}:::(?!:)\s+repo-card(?:\s+(.*))?\s*$/;

const SHIELD_METRICS = {
  language: {
    path: "languages/top",
    label: "Primary language",
    link: (repoBase: string) => `${repoBase}/graphs/languages`,
  },
  stars: {
    path: "stars",
    label: "Stars",
    link: (repoBase: string) => `${repoBase}/stargazers`,
  },
  forks: {
    path: "forks",
    label: "Forks",
    link: (repoBase: string) => `${repoBase}/forks`,
  },
  license: {
    path: "license",
    label: "License",
    link: (repoBase: string) => `${repoBase}#readme`,
  },
} as const;

type ShieldMetric = keyof typeof SHIELD_METRICS;

function shieldsRepoBadge(repo: string, metric: ShieldMetric): string {
  const config = SHIELD_METRICS[metric];
  const slug = encodeURIComponent(repo);
  return `https://img.shields.io/github/${config.path}/${slug}?style=flat`;
}

function renderRepoShield(
  repo: string,
  metric: ShieldMetric,
  repoBase: string,
): string {
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
    super("repo_card");
  }

  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    return OPEN_RE.test(lines[index] ?? "");
  }

  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const block = readTripleColonBlock(lines, index, OPEN_RE);
    if (!block) return null;

    const { repo, link, visibility } = parseRepoCardOpen(block.attrs);
    if (!repo) return null;

    const children = ctx.parseBlocks(normalizeInnerLines(block.innerLines));

    return {
      node: createNode(
        this.type,
        blockLength(lines, index, block.nextIndex),
        undefined,
        children,
        { repo, link, visibility },
      ),
      nextIndex: block.nextIndex,
    };
  }

  render(node: MarkdownNode, ctx: RenderContext) {
    const repo = String(node.props?.repo ?? "");
    const href =
      String(node.props?.link ?? "") ||
      (repo ? `https://github.com/${repo}` : "");
    const repoBase = repo ? `https://github.com/${repo}` : "";
    const visibility = String(node.props?.visibility ?? "Public");
    const bodyHtml = ctx.renderBlock(node.children ?? []);

    const descHtml = bodyHtml.trim()
      ? `<div class="cherry-repo-card__desc">${bodyHtml}</div>`
      : "";

    const parts = [
      `<div class="cherry-repo-card"${this.sourceLineAttrs(node)}>`,
    ];

    parts.push(`<p class="cherry-repo-card__name">`);
    parts.push(
      `<span class="cherry-repo-card__icon" aria-hidden="true"></span>`,
    );
    if (href && repo) {
      parts.push(
        `<span class="cherry-repo-card__link"><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(repo)}">${escapeHtml(repo)}</a></span>`,
      );
    } else if (repo) {
      parts.push(
        `<span class="cherry-repo-card__link">${escapeHtml(repo)}</span>`,
      );
    }
    if (visibility) {
      parts.push(
        `<span class="cherry-repo-card__visibility">${escapeHtml(visibility)}</span>`,
      );
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
