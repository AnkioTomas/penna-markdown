import {
  getCherryCodeHighlightLoader,
  hydrateCherryCodeHighlight,
  resetCherryCodeHighlightTheme,
} from "../highlight/setup.js";
import { isDark as detectDark } from "./isDark.js";
import { hydrateCherryMedia } from "./media.js";

export interface ThemeRefreshOptions {
  isDark?: (container: ParentNode) => boolean;
}

function resolveIsDark(
  mount: HTMLElement,
  options?: ThemeRefreshOptions,
): (container: ParentNode) => boolean {
  return options?.isDark ?? ((container) => detectDark(container));
}

export function afterRender(mount: HTMLElement, options?: ThemeRefreshOptions): void {
  const isDark = resolveIsDark(mount, options);
  hydrateCherryMedia(mount, { isDark });

  const highlightLoader = getCherryCodeHighlightLoader();
  if (highlightLoader) {
    void hydrateCherryCodeHighlight(mount, {
      getAdapter: highlightLoader,
      isDark,
    });
  }
}

export function refreshAfterTheme(mount: HTMLElement, options?: ThemeRefreshOptions): void {
  resetCherryCodeHighlightTheme(mount);
  afterRender(mount, options);
}
