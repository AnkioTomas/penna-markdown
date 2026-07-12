/**
 * @file 预览区图片 / SVG 点击放大
 * @module renderer/image/image
 *
 * 在预览挂载点做**事件委托**，点击内容区 `img` 或内联 `svg` 时打开全屏 lightbox。
 * 委托绑定在 mount 上，增量 reconcile 替换子节点后无需重新挂载监听。
 */

const EXCLUDED_IMG_SELECTOR = [
  ".cherry-math-latex",
  ".cherry-repo-card__shield-img",
  ".cherry-link-card__icon",
  ".cherry-audio-player__cover-img",
].join(",");

const EXCLUDED_ANCESTOR_SELECTOR = "button";

/** 判断预览区图片是否可放大。 */
export function isPreviewableImage(img: HTMLImageElement): boolean {
  if (img.matches(EXCLUDED_IMG_SELECTOR)) return false;
  if (img.closest(EXCLUDED_ANCESTOR_SELECTOR)) return false;
  return Boolean(img.currentSrc || img.src);
}

/** 判断预览区内联 SVG 是否可放大。 */
export function isPreviewableSvg(svg: SVGSVGElement): boolean {
  if (svg.getAttribute("aria-hidden") === "true") return false;
  if (svg.closest(EXCLUDED_ANCESTOR_SELECTOR)) return false;
  return true;
}

/** 将源图尺寸写入预览图，避免未加载或 flex 布局塌缩为 0×0。 */
export function applyPreviewImageSize(
  preview: HTMLImageElement,
  source: HTMLImageElement,
): void {
  const naturalWidth = source.naturalWidth || preview.naturalWidth;
  const naturalHeight = source.naturalHeight || preview.naturalHeight;
  if (naturalWidth > 0 && naturalHeight > 0) {
    preview.width = naturalWidth;
    preview.height = naturalHeight;
    return;
  }

  const rect = source.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    preview.style.width = `${rect.width}px`;
    preview.style.height = `${rect.height}px`;
  }
}

/** 为克隆的 SVG 补齐可渲染尺寸。 */
function applyPreviewSvgSize(
  preview: SVGSVGElement,
  source: SVGSVGElement,
): void {
  const viewBox = source.viewBox?.baseVal;
  const hasViewBox = viewBox && viewBox.width > 0 && viewBox.height > 0;

  if (hasViewBox) {
    preview.setAttribute(
      "viewBox",
      `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`,
    );
  }

  const rect = source.getBoundingClientRect();
  const w = rect.width > 0 ? rect.width : hasViewBox ? viewBox.width : 0;
  const h = rect.height > 0 ? rect.height : hasViewBox ? viewBox.height : 0;

  if (w > 0 && h > 0) {
    preview.setAttribute("width", String(w));
    preview.setAttribute("height", String(h));
  }
}

/**
 * 预览区图片 / SVG 点击放大监听器。
 *
 * 构造时注册 `click` 委托；{@link destroy} 时移除并关闭 overlay。
 */
export class ImageListener {
  private overlay: HTMLElement | null = null;
  private savedBodyOverflow = "";
  private readonly onClickBound = (e: MouseEvent) => this.onClick(e);
  private readonly onKeyDownBound = (e: KeyboardEvent) => this.onKeyDown(e);

  /**
   * @param mount 预览挂载点（与 {@link Renderer} 的 `mount` 相同）
   */
  constructor(private readonly mount: HTMLElement) {
    this.mount.addEventListener("click", this.onClickBound);
  }

  /** 委托入口：匹配可预览图片或 SVG 后打开 lightbox。 */
  private onClick(e: MouseEvent) {
    const target = e.target;
    if (!target || typeof (target as Element).closest !== "function") return;

    const img = (target as Element).closest("img");
    if (img && this.mount.contains(img)) {
      if (!isPreviewableImage(img as HTMLImageElement)) return;
      e.preventDefault();
      this.openImage(img as HTMLImageElement);
      return;
    }

    const svg = (target as Element).closest("svg");
    if (
      svg &&
      svg.namespaceURI === "http://www.w3.org/2000/svg" &&
      this.mount.contains(svg)
    ) {
      if (!isPreviewableSvg(svg as SVGSVGElement)) return;
      e.preventDefault();
      this.openSvg(svg as SVGSVGElement);
    }
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape" && this.overlay) this.close();
  }

  private openImage(img: HTMLImageElement) {
    const doc = img.ownerDocument;
    const caption = img.alt || img.title || "";

    const preview = doc.createElement("img");
    preview.className = "cherry-image-preview__media";
    preview.alt = img.alt;
    preview.src = img.currentSrc || img.src;
    applyPreviewImageSize(preview, img);

    this.openOverlay(doc, preview, caption);
  }

  private openSvg(svg: SVGSVGElement) {
    const doc = svg.ownerDocument;
    const preview = svg.cloneNode(true) as SVGSVGElement;
    preview.classList.add("cherry-image-preview__media");
    applyPreviewSvgSize(preview, svg);
    const titleText = preview.querySelector("title")?.textContent?.trim();
    const caption = svg.getAttribute("aria-label") || titleText || "";
    this.openOverlay(doc, preview, caption);
  }

  private openOverlay(
    doc: Document,
    media: HTMLElement | SVGSVGElement,
    caption: string,
  ): void {
    this.close();

    const overlay = doc.createElement("div");
    overlay.className = "cherry-image-preview";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    const backdrop = doc.createElement("button");
    backdrop.type = "button";
    backdrop.className = "cherry-image-preview__backdrop";
    backdrop.setAttribute("aria-label", "关闭");
    backdrop.addEventListener("click", () => this.close());

    const figure = doc.createElement("figure");
    figure.className = "cherry-image-preview__figure";
    figure.append(media);

    if (caption) {
      const figcaption = doc.createElement("figcaption");
      figcaption.className = "cherry-image-preview__caption";
      figcaption.textContent = caption;
      figure.append(figcaption);
    }

    overlay.append(backdrop, figure);
    doc.body.appendChild(overlay);
    doc.addEventListener("keydown", this.onKeyDownBound);

    this.savedBodyOverflow = doc.body.style.overflow;
    doc.body.style.overflow = "hidden";
    this.overlay = overlay;
  }

  /** 关闭 lightbox 并恢复页面滚动。 */
  close(): void {
    if (!this.overlay) return;
    const doc = this.mount.ownerDocument;
    doc.removeEventListener("keydown", this.onKeyDownBound);
    this.overlay.remove();
    this.overlay = null;
    doc.body.style.overflow = this.savedBodyOverflow;
    this.savedBodyOverflow = "";
  }

  /** 移除 mount 上的 click 委托并关闭 overlay。 */
  destroy(): void {
    this.close();
    this.mount.removeEventListener("click", this.onClickBound);
  }
}
