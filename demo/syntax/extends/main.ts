import "../../_common/cherry-demo.scss";
import "../../_common/layout.scss";
import "../syntax-demo.scss";
import { Renderer } from "@/renderer/Renderer.js";
import { Theme } from "@/theme/Theme.js";
import { setupPreviewThemeAndAppearance } from "../../_common/theme.js";
import { requiredEl } from "../../_common/dom.js";
import { EXTENDS_DATA } from "./data.js";

async function init() {
  const menuList = requiredEl<HTMLElement>("#menu-list");
  const sourcePreview = requiredEl<HTMLElement>("#source-preview");
  const htmlPreview = requiredEl<HTMLElement>("#html-preview");
  const themeRoot = requiredEl<HTMLElement>("#theme-root");
  const theme = new Theme();
  const renderer = new Renderer({ mount: htmlPreview, theme });

  let activeId = EXTENDS_DATA[0].id;

  function renderMenu() {
    menuList.innerHTML = "";
    EXTENDS_DATA.forEach((item) => {
      const el = document.createElement("div");
      el.className = `menu-item ${item.id === activeId ? "active" : ""}`;
      el.textContent = item.name;
      el.addEventListener("click", () => {
        activeId = item.id;
        renderMenu();
        renderContent();
      });
      menuList.appendChild(el);
    });
  }

  function renderContent() {
    const item = EXTENDS_DATA.find((i) => i.id === activeId);
    if (item) {
      sourcePreview.textContent = item.markdown;
      renderer.render(item.markdown);
    }
  }

  setupPreviewThemeAndAppearance(theme, htmlPreview, themeRoot, {
    onThemeChange: renderContent,
  });

  renderMenu();
  renderContent();
}

init();
