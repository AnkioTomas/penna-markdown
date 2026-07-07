import "../../_common/layout.scss";
import "@/theme/style/transformer.scss";
import { Renderer } from "@/renderer/Renderer.js";
import { Theme } from "@/theme/Theme.js";
import { SYNTAX_DATA } from "./data.js";

async function init() {
  const menuList = document.getElementById("menu-list")!!;
  const sourcePreview = document.getElementById("source-preview")!!;
  const htmlPreview = document.getElementById("html-preview")!!;
  const renderer = new Renderer({ mount: htmlPreview, theme: new Theme() });

  let activeId = SYNTAX_DATA[0].id;

  function renderMenu() {
    menuList.innerHTML = "";
    SYNTAX_DATA.forEach(item => {
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
    const item = SYNTAX_DATA.find(i => i.id === activeId);
    if (item) {
      sourcePreview.textContent = item.markdown;
      renderer.render(item.markdown);
    }
  }

  renderMenu();
  renderContent();
}

init();
