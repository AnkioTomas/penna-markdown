import { audio, img, video } from "../placeholder.js";

const audioPoster = img(320, 180, "音频封面", { bg: "6366f1" });
const videoPoster = img(640, 360, "视频封面", { bg: "0f766e" });

/** @type {import('./syntaxExample.js').SyntaxExample} */
export default {
  name: "media",
  desc: "视频 / 音频与 poster 封面",
  markdown: `!video[演示视频](${video})

!audio[背景音乐](${audio})

!audio[带封面](${audio}){poster=${audioPoster}}

!video[带封面](${video}){poster=${videoPoster}}`,
};
