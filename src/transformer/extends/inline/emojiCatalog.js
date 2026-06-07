/**
 * 常见 emoji 短码（GitHub / Slack 风格）
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

/** @param {string} raw */
export function resolveEmojiShortcode(raw) {
  const key = raw.trim();
  if (!key) return null;
  return EMOJI_CATALOG[key] ?? EMOJI_CATALOG[key.toLowerCase()] ?? null;
}

export function getEmojiCatalog() {
  return { ...EMOJI_CATALOG };
}
