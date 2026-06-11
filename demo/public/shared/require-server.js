/**
 * 检测是否通过 file:// 打开。Demo 依赖 ES module，必须通过 HTTP 服务访问。
 */
if (location.protocol === "file:") {
  const banner = document.createElement("div");
  banner.setAttribute("role", "alert");
  banner.style.cssText =
    "margin:0;padding:14px 18px;background:#fef3c7;color:#92400e;border-bottom:2px solid #f59e0b;font:14px/1.5 system-ui,sans-serif";
  banner.textContent =
    "Demo 不能通过本地文件直接打开（JS 模块会被浏览器拦截）。请在项目根目录运行 pnpm demo，然后访问 http://localhost:5173";
  document.body.prepend(banner);
}
