/**
 * Demo 占位资源 — 统一走 Ankio API
 * @see https://api.ankio.net/?help=1 全量接口帮助（任意接口加 ?help=1 可查看该接口说明）
 */
export const API_BASE = "https://api.ankio.net";

/** 随机音频（302 → sample MP3） */
export const audio = `${API_BASE}/music`;

/** 随机视频（302 → sample MP4） */
export const video = `${API_BASE}/video`;

export interface PlaceholderImageStyle {
  fg?: string;
  bg?: string;
}

/** 随机图片 — `/picsum/{width}/{height}` */
export function img(
  width: number,
  height: number,
  _text?: string,
  _style: PlaceholderImageStyle = {},
): string {
  const w = Math.min(5000, Math.max(1, Math.round(width)));
  const h = Math.min(5000, Math.max(1, Math.round(height)));
  return `${API_BASE}/picsum/${w}/${h}`;
}

/** 站点 favicon — `/favicon?url=` */
export function favicon(siteUrl: string): string {
  return `${API_BASE}/favicon?url=${encodeURIComponent(siteUrl)}`;
}
