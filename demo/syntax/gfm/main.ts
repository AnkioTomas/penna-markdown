import "../../_common/penna-demo.scss";
import "../../_common/layout.scss";
import "../syntax-demo.scss";
import { Renderer } from "@/renderer/Renderer.js";
import {
  createDemoTheme,
  setupPreviewThemeAndAppearance,
} from "../../_common/theme.js";
import { requiredEl } from "../../_common/dom.js";
import { SYNTAX_DATA } from "./data.js";

async function init() {
  const menuList = requiredEl<HTMLElement>("#menu-list");
  const sourcePreview = requiredEl<HTMLElement>("#source-preview");
  const htmlPreview = requiredEl<HTMLElement>("#html-preview");
  const themeRoot = requiredEl<HTMLElement>("#theme-root");
  const kit = createDemoTheme(themeRoot);
  const renderer = new Renderer({
    mount: htmlPreview,
    theme: kit.theme,
    eventBus: kit.eventBus,
    logger: kit.log,
  });

  let activeId = SYNTAX_DATA[0].id;

  function renderMenu() {
    menuList.innerHTML = "";
    SYNTAX_DATA.forEach((item) => {
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
    const item = SYNTAX_DATA.find((i) => i.id === activeId);
    if (item) {
      sourcePreview.textContent = item.markdown;
      renderer.render(item.markdown);
    }
  }

  setupPreviewThemeAndAppearance(kit, htmlPreview, {
    onThemeChange: renderContent,
  });

  renderMenu();
  renderContent();
}

init();
