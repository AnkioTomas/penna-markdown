import {
  base64UrlDecode,
  buildMermaidImageSrc,
} from "@/transformer/extends/block/specialCode.js";

export function replaceGraph(container: HTMLElement, dark: boolean): void {
  const chartTheme = dark ? ("dark" as const) : undefined;

  container
    .querySelectorAll(".cherry-math-latex[data-latex]")
    .forEach((img) => {
      if (!(img instanceof Image)) return;
      img.src = img.src.replace(
        dark ? "color=black" : "color=white",
        dark ? "color=white" : "color=black",
      );
    });

  container
    .querySelectorAll(".cherry-mermaid__img[data-mermaid]")
    .forEach((img) => {
      if (!(img instanceof Image)) return;
      const code = base64UrlDecode(img.getAttribute("data-mermaid") ?? "");
      const src = buildMermaidImageSrc(code, { theme: chartTheme });
      if (src && (img as HTMLImageElement).src !== src)
        (img as HTMLImageElement).src = src;
    });

  container
    .querySelectorAll(".cherry-echarts__img[data-echarts]")
    .forEach((img) => {
      if (!(img instanceof Image)) return;
      if (dark) {
        img.src = img.src.replace("theme%22%3A%22%22", "theme%22%3A%22dark%22");
      } else {
        img.src = img.src.replace("theme%22%3A%22dark%22", "theme%22%3A%22%22");
      }
    });
}
