import { SYNC_MEDIA_SELECTOR } from "./mapScroll.js";
import { SOURCE_LINE_ATTR } from "@/transformer/utils/sourceLine.js";

export interface PreviewLayoutWatcher {
  disconnect(): void;
}

/**
 * 监听预览区布局变化（图片/媒体加载、块尺寸变化），触发重新测量锚点。
 */
export function watchPreviewLayout(
  scrollEl: HTMLElement,
  onLayoutChange: () => void,
): PreviewLayoutWatcher {
  let rafId = 0;
  const schedule = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(onLayoutChange);
  };

  const blockObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(schedule)
      : null;

  const mediaLoads = new Set<EventTarget>();
  const onMediaLoad = (event: Event) => schedule();

  const bindMedia = (root: ParentNode) => {
    root.querySelectorAll(SYNC_MEDIA_SELECTOR).forEach((el) => {
      if (mediaLoads.has(el)) return;
      mediaLoads.add(el);
      el.addEventListener("load", onMediaLoad, { passive: true });
      if (el instanceof HTMLVideoElement) {
        el.addEventListener("loadedmetadata", onMediaLoad, { passive: true });
      }
      if (el instanceof HTMLIFrameElement) {
        el.addEventListener("load", onMediaLoad, { passive: true });
      }
    });
  };

  const bindBlocks = () => {
    scrollEl.querySelectorAll<HTMLElement>(`[${SOURCE_LINE_ATTR}]`).forEach((block) => {
      blockObserver?.observe(block);
      bindMedia(block);
    });
    bindMedia(scrollEl);
  };

  bindBlocks();

  const rootObserver =
    typeof MutationObserver !== "undefined"
      ? new MutationObserver(() => {
          bindBlocks();
          schedule();
        })
      : null;

  rootObserver?.observe(scrollEl, { childList: true, subtree: true });

  const scrollResizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(schedule)
      : null;
  scrollResizeObserver?.observe(scrollEl);

  return {
    disconnect() {
      cancelAnimationFrame(rafId);
      blockObserver?.disconnect();
      scrollResizeObserver?.disconnect();
      rootObserver?.disconnect();
      for (const el of mediaLoads) {
        el.removeEventListener("load", onMediaLoad);
        if (el instanceof HTMLVideoElement) {
          el.removeEventListener("loadedmetadata", onMediaLoad);
        }
      }
      mediaLoads.clear();
    },
  };
}
