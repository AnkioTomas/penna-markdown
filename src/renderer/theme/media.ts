import {
  base64UrlDecode,
  buildEchartsImageSrc,
  buildMermaidImageSrc,
} from "@/transformer/extends/block/specialCode.js";
import { buildMathImageSrc } from "@/transformer/extends/block/mathBlock.js";
import { findCherryRoot } from "../container.js";
import { isDark } from "./isDark.js";

/** 根据明暗主题刷新远程媒体图片 URL。 */
export function hydrateCherryMedia(
  container: ParentNode | null | undefined,
  options: { isDark?: (container: ParentNode) => boolean } = {},
): void {
  const cherry = findCherryRoot(container);
  if (!cherry) return;

  const dark = options.isDark?.(cherry) ?? false;
  const mathColor = dark ? "white" : undefined;
  const chartTheme = dark ? ("dark" as const) : undefined;

  cherry.querySelectorAll(".cherry-math-latex[data-latex]").forEach((img) => {
    if (!("src" in img)) return;
    const latex = img.getAttribute("data-latex") ?? "";
    const inline = img.getAttribute("data-inline") === "true";
    const src = buildMathImageSrc(latex, { inline, color: mathColor });
    if (src && (img as HTMLImageElement).src !== src) (img as HTMLImageElement).src = src;
  });

  cherry.querySelectorAll(".cherry-mermaid__img[data-mermaid]").forEach((img) => {
    if (!("src" in img)) return;
    const code = base64UrlDecode(img.getAttribute("data-mermaid") ?? "");
    const src = buildMermaidImageSrc(code, { theme: chartTheme });
    if (src && (img as HTMLImageElement).src !== src) (img as HTMLImageElement).src = src;
  });

  cherry.querySelectorAll(".cherry-echarts__img[data-echarts]").forEach((img) => {
    if (!("src" in img)) return;
    const source = base64UrlDecode(img.getAttribute("data-echarts") ?? "");
    const src = buildEchartsImageSrc(source, { theme: chartTheme });
    if (src && (img as HTMLImageElement).src !== src) (img as HTMLImageElement).src = src;
  });
}
