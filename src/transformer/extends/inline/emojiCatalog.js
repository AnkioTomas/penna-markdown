/**
 * @file Emoji 短码目录
 * @module transformer/extends/inline/emojiCatalog
 *
 * 常见 emoji 短码映射表（GitHub / Slack 风格），供 `:shortcode:` 语法解析使用。
 */

/**
 * 短码名到 Unicode emoji 的映射表。
 *
 * @type {Record<string, string>}
 */
const EMOJI_CATALOG = {
  "+1": "👍",
  "-1": "👎",
  smile: "😄",
  smiley: "😃",
  grin: "😁",
  grinning: "😀",
  laugh: "😆",
  laughing: "😆",
  joy: "😂",
  rofl: "🤣",
  wink: "😉",
  blush: "😊",
  heart: "❤️",
  heart_eyes: "😍",
  kissing_heart: "😘",
  thinking: "🤔",
  cry: "😢",
  sob: "😭",
  angry: "😠",
  rage: "😡",
  thumbsup: "👍",
  thumbsdown: "👎",
  clap: "👏",
  ok_hand: "👌",
  wave: "👋",
  fire: "🔥",
  rocket: "🚀",
  tada: "🎉",
  star: "⭐",
  sparkles: "✨",
  check: "✅",
  x: "❌",
  warning: "⚠️",
  bulb: "💡",
  coffee: "☕",
  beer: "🍺",
  pizza: "🍕",
  cat: "🐱",
  dog: "🐶",
  sun: "☀️",
  moon: "🌙",
  cloud: "☁️",
  umbrella: "☔",
  snowflake: "❄️",
  微笑: "😊",
  笑: "😄",
  赞: "👍",
  点赞: "👍",
  火: "🔥",
  心: "❤️",
};

/**
 * 将短码名解析为 emoji 字符。
 *
 * @param {string} raw - 冒号之间的短码名
 * @returns {string | null} 对应 emoji，未命中时返回 null
 */
export function resolveEmojiShortcode(raw) {
  const key = raw.trim();
  if (!key) return null;
  return EMOJI_CATALOG[key] ?? EMOJI_CATALOG[key.toLowerCase()] ?? null;
}

/**
 * 返回 emoji 目录的浅拷贝副本。
 *
 * @returns {Record<string, string>}
 */
export function getEmojiCatalog() {
  return { ...EMOJI_CATALOG };
}
