import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ html: true });
const registeredPlugins = [];

export function registerMarkdownPlugin(plugin, options = {}) {
  if (!registeredPlugins.includes(plugin)) {
    md.use(plugin, options);
    registeredPlugins.push(plugin);
  }
}

export function markdownToHtml(markdownText) {
  return md.render(markdownText);
}