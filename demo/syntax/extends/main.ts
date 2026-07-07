import "../../_common/layout.scss";
import "@/theme/style/transformer.scss"; // 仅引入默认渲染主题
import { Renderer } from "@/renderer/Renderer.js";
import { Theme } from "@/theme/Theme.js";

const EXTENDS_DATA = [
  {
    id: "html-attrs",
    name: "内联属性 (HTML Attrs)",
    markdown: `### 1. 添加类名\n你可以非常方便地通过属性注入给文本加样式：\n[这段文字会被赋予 text-red 类名]{.text-red}\n[这段文字同时包含多个类名]{.text-blue .font-bold}\n\n### 2. 添加 ID\n给特定文字增加锚点标识：\n[带有 ID 的文字，常用于页内跳转]{#my-id}\n\n### 3. 混合使用\n[同时包含 ID 和 class 的增强文本]{#target-text .bg-gray .text-white}`
  },
  {
    id: "container",
    name: "自定义容器 (Alert)",
    markdown: `### 1. 提示 (Note)\n::: note 提示\n这是一条 Note 容器。用来记录重要但非警告性质的信息。你可以把补充说明放这里。\n:::\n\n### 2. 警告 (Warning)\n::: warning 警告\n这是一条 Warning 容器，请小心操作！通常用于提示潜在的问题。\n:::\n\n### 3. 危险 (Danger)\n::: danger 危险\n操作具有破坏性，数据无法恢复！用于极度致命的报错提示。\n:::\n\n### 4. 技巧 (Tip)\n::: tip 技巧\n这是一个有用的小技巧。帮助用户提升效率的小提示。\n:::\n\n### 5. 容器内嵌内容\n::: tip\n如果不写标题，会自动采用默认标题。\n容器内同样支持：\n- 列表\n- **加粗**\n- \`行内代码\`\n:::`
  },
  {
    id: "collapse",
    name: "折叠块 (Details / Collapse)",
    markdown: `### 1. 基础折叠块\n::: details 点击展开查看详细内容\n这是一段被折叠的文本，适合用来收纳长篇大论。\n:::\n\n### 2. 折叠代码示例\n::: details 查看完整配置文件\n\`\`\`json\n{\n  \"name\": \"cherry-markdown-next\",\n  \"version\": \"1.0.0\"\n}\n\`\`\`\n:::\n\n### 3. 嵌套折叠块\n::: details 第一层折叠\n第一层内容。\n::: details 第二层折叠\n嵌套的更深层的内容。\n:::\n:::`
  },
  {
    id: "task-list",
    name: "增强任务列表 (Task List)",
    markdown: `### 1. 基础状态\n- [ ] 未完成的任务 (Pending)\n- [x] 已完成的任务 (Done)\n\n### 2. 扩展状态\nCherry Markdown 提供了更加丰富的任务标记逻辑：\n- [-] 正在进行中的任务 (In Progress)\n- [!] 需要注意/被阻止的任务 (Blocked / Warning)\n- [>] 延期的任务 (Deferred)\n- [<] 提前安排的任务 (Scheduled)\n\n### 3. 嵌套任务\n- [ ] 主线任务\n  - [x] 子任务 1\n  - [-] 子任务 2\n  - [ ] 子任务 3`
  },
  {
    id: "tabs",
    name: "选项卡 (Tabs)",
    markdown: `### 1. 基础选项卡\n::: tabs\n@tab 选项卡 1\n这是选项卡 1 的专属内容区。\n@tab 选项卡 2\n这是选项卡 2 的专属内容区。\n:::\n\n### 2. 多语言代码切换演示\n::: tabs\n@tab JavaScript\n\`\`\`javascript\nconsole.log(\"Hello Tab!\");\n\`\`\`\n@tab Python\n\`\`\`python\nprint(\"Hello Tab!\")\n\`\`\`\n@tab Rust\n\`\`\`rust\nprintln!(\"Hello Tab!\");\n\`\`\`\n:::`
  },
  {
    id: "steps",
    name: "步骤条 (Steps)",
    markdown: `### 1. 基础步骤条\n::: steps\n\n1. 第一步操作\n\n   请先下载安装包并完成安装。这里的内容就是步骤详情。\n\n2. 第二步操作\n\n   打开软件并进行初始配置。\n\n3. 最终步\n\n   尽情享受软件带来的便利！\n\n:::\n\n### 2. 步骤内包含复杂内容\n::: steps\n1. 初始化项目\n\n   运行以下命令：\n   \`\`\`bash\n   npm install\n   \`\`\`\n\n2. 启动服务\n\n   运行完成后，通过 \`npm run dev\` 启动。\n:::`
  },
  {
    id: "timeline",
    name: "时间轴 (Timeline)",
    markdown: `### 1. 项目演进时间线\n::: timeline\n\n- 2023年发布\n\n  发布了重大更新 v2.0，重构了底层渲染引擎。\n\n- 2024年更新\n\n  全面拥抱 TypeScript，并且移除了对陈旧浏览器的支持。\n\n- 未来规划\n\n  > 引入 WebAssembly 提升解析速度！\n\n:::\n\n### 2. 操作记录流\n::: timeline\n- 08:00 用户登录\n- 08:15 提交表单数据\n- 08:20 触发审批流\n- 09:00 **审批完成**\n:::`
  },
  {
    id: "math",
    name: "数学公式 (Math)",
    markdown: `### 1. 行内公式\n爱因斯坦质能方程是伟大的 $E = mc^2$，欧拉公式则是 $e^{i\\pi} + 1 = 0$。\n\n### 2. 块级公式 (Block Math)\n一元二次方程求根公式：\n$$ \nx = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}\n$$\n\n傅里叶变换：\n$$ \nf(x) = \\int_{-\\infty}^\\infty \\hat f(\\xi)\\,e^{2 \\pi i \\xi x} \\,d\\xi\n$$`
  },
  {
    id: "special-code",
    name: "高级图表 (Mermaid / ECharts)",
    markdown: `### 1. Mermaid 流程图\n\`\`\`mermaid\ngraph TD;\n    Start[开始] --> Check{检查权限};\n    Check -- 有权限 --> Pass[通过验证];\n    Check -- 无权限 --> Reject[拒绝访问];\n    Pass --> End[结束];\n    Reject --> End;\n\`\`\`\n\n### 2. Mermaid 时序图\n\`\`\`mermaid\nsequenceDiagram\n    Alice->>+John: Hello John, how are you?\n    John-->>-Alice: Great!\n\`\`\`\n\n### 3. ECharts 图表\n\`\`\`echarts\n{\n  \"title\": { \"text\": \"ECharts 销量示例\" },\n  \"xAxis\": {\n    \"type\": \"category\",\n    \"data\": [\"Mon\", \"Tue\", \"Wed\", \"Thu\", \"Fri\", \"Sat\", \"Sun\"]\n  },\n  \"yAxis\": { \"type\": \"value\" },\n  \"series\": [{\n    \"data\": [120, 200, 150, 80, 70, 110, 130],\n    \"type\": \"bar\"\n  }]\n}\n\`\`\``
  },
  {
    id: "badge",
    name: "徽章 (Badge)",
    markdown: `### 1. 基础状态徽章\n常规版本号 [v1.0.0]{.badge}\n新特性上线 [New]{.badge .tip}\n警告信息 [Warning]{.badge .warning}\n严重问题 [Error]{.badge .danger}\n\n### 2. 徽章与正文结合\n今天我们发布了 [v2.5.0]{.badge .tip} 版本，解决了一个 [严重内存泄露]{.badge .danger} 的 Bug。`
  },
  {
    id: "supsub",
    name: "上标与下标 (Superscript / Subscript)",
    markdown: `### 1. 下标 (Subscript)\n化学公式：水的化学式是 H~2~O，二氧化碳是 CO~2~，硫酸是 H~2~SO~4~。\n\n### 2. 上标 (Superscript)\n数学指数：2^10^ 等于 1024，而 3^3^ 等于 27。\n\n面积单位：平方米用 m^2^ 表示，体积则是 m^3^。`
  },
  {
    id: "spoiler",
    name: "剧透模糊 (Spoiler)",
    markdown: `### 1. 剧透保护\n这是一段包含剧透的影评：这部电影的结局非常令人震惊，因为 !!主角其实在一开始就已经死了!!。鼠标悬停在上方区域才能看清文字。\n\n### 2. 多段落剧透\n!!如果你看到了这段文字!!，说明你触发了反白区域。\n支持在同一段落里出现多个 !!隐藏要素一!! 和 !!隐藏要素二!!。`
  },
  {
    id: "footnote",
    name: "脚注 (Footnote)",
    markdown: `### 1. 单个脚注\n这是一个需要引用的专业术语[^1]。\n\n### 2. 多个脚注\n你可以在一篇文章中定义多个脚注标识，例如这里有第二个引用[^2] 以及第三个引用[^3]。\n\n---\n\n[^1]: 术语解释：这里是关于该术语的极其详细的说明文字。\n[^2]: 引用来源：《Cherry Markdown 指南》第 20 页。\n[^3]: 扩展阅读：你可以参考官网获取更多信息。`
  },
  {
    id: "emoji",
    name: "表情符号 (Emoji)",
    markdown: `### 1. 常用表情\n大笑 :smile:\n庆祝 :tada:\n火箭上线 :rocket:\n\n### 2. 心情与状态\n开心 :grin:\n伤心 :cry:\n点赞 :+1:\n踩 :-1:`
  },
  {
    id: "highlight",
    name: "文字高亮 (Highlight)",
    markdown: `### 1. 基础高亮\n阅读时，我们需要关注重点信息，比如这段话中的 ==极其关键的字眼==，这会被 <mark> 标签包裹。\n\n### 2. 连续高亮\n测试 ==第一处高亮== 和 ==第二处高亮== 的连续渲染。`
  },
  {
    id: "card",
    name: "卡片系统 (Repo / Link Card)",
    markdown: `### 1. Github 仓库卡片\n::: repo-card vuepress/core\n:::\n\n::: repo-card Tencent/cherry-markdown\n:::\n\n### 2. 通用链接卡片\n::: link-card https://github.com\n:::\n\n::: link-card https://google.com\n:::`
  }
];

async function init() {
  const menuList = document.getElementById("menu-list")!!;
  const sourcePreview = document.getElementById("source-preview")!!;
  const htmlPreview = document.getElementById("html-preview")!!;
  const renderer = new Renderer({ mount: htmlPreview, theme: new Theme() });

  let activeId = EXTENDS_DATA[0].id;

  function renderMenu() {
    menuList.innerHTML = "";
    EXTENDS_DATA.forEach(item => {
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
    const item = EXTENDS_DATA.find(i => i.id === activeId);
    if (item) {
      sourcePreview.textContent = item.markdown;
      renderer.render(item.markdown);
    }
  }

  renderMenu();
  renderContent();
}

init();
