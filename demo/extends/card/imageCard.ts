import type { SyntaxExample } from '../../syntax-example.js';
import { img } from "../../placeholder.js";

const cover = img(640, 360, "灯塔", { bg: "1e3a5f" });

const example = {
  name: "image-card",
  desc: "图片卡片 ::: image-card",
  markdown: `::: image-card image="${cover}" title="阿尔凡齐纳灯塔，阿尔加维，葡萄牙" href="/" author="Andreas Kunz" date="2024/08/16"

今天照片中的灯塔位于葡萄牙南部海岸阿尔加维的卡沃埃罗。
:::`,
} satisfies SyntaxExample;

export default example;
