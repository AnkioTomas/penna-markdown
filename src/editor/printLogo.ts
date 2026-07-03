const CHERRY_VERSION = "0.1.0";
const PROJECT_NAME = "Cherry Markdown Next";
const GITHUB_REPO = "https://github.com/AnkioTomas/cherry-markdown-net";
const AUTHOR_BLOG = "https://ankio.net";

function isBrowser(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as { document?: unknown }).document !== "undefined"
  );
}

let logoPrinted = false;

/** 浏览器控制台彩色欢迎语（全局仅输出一次） */
export function printCherryLogo(): void {
  if (!isBrowser() || logoPrinted) return;
  logoPrinted = true;

  const muted = "color:#6b7280;font-size:12px;";
  const title = "color:#e11d48;font-size:18px;font-weight:700;";
  const name = "color:#111827;font-size:16px;font-weight:700;";
  const badge =
    "background:#e11d48;color:#fff;font-size:11px;font-weight:600;padding:2px 6px;border-radius:4px;";
  const link = "color:#2563eb;font-size:12px;font-weight:600;";

  console.log(
    "%c🍒%c " + PROJECT_NAME + "%c v" + CHERRY_VERSION,
    title,
    name,
    badge,
  );
  console.log("%cWelcome! Thanks for using " + PROJECT_NAME + ".", muted);
  console.log("%cGitHub:%c " + GITHUB_REPO, muted, link);
  console.log("%cBlog:%c " + AUTHOR_BLOG, muted, link);
}
