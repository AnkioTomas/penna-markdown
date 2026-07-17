const CHERRY_VERSION = "0.1.0";
const PROJECT_NAME = "Penna Markdown";
const GITHUB_REPO = "https://github.com/AnkioTomas/penna-markdown";
const AUTHOR_BLOG = "https://ankio.net";

/** 浏览器控制台彩色欢迎语（全局仅输出一次） */
export function printPennaLogo(): void {
  const muted = "color:#6b7280;font-size:14px;";
  const title = "color:#008dee;font-size:18px;font-weight:700;";
  const name = "color:#0c1c25;font-size:16px;font-weight:700;";
  const badge =
    "background:#008dee;color:#fff;font-size:11px;font-weight:600;padding:2px 6px;border-radius:4px;";
  const link = "color:#008dee;font-size:12px;font-weight:600;";

  console.log(
    "%c🪶%c " + PROJECT_NAME + "%c v" + CHERRY_VERSION,
    title,
    name,
    badge,
  );
  console.log("%cWelcome! Thanks for using " + PROJECT_NAME + ".", muted);
  console.log("%cGitHub:%c " + GITHUB_REPO, muted, link);
  console.log("%cBlog:%c " + AUTHOR_BLOG, muted, link);
}
