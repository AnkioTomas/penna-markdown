import { img } from "../../placeholder.js";

const inline = img(320, 180, "替代文字");
const titled = img(480, 270, "带标题", { bg: "3498db" });
const ref = img(240, 160, "引用图", { bg: "9b59b6" });
const wide = img(640, 200, "宽图", { bg: "2c3e50" });
const tall = img(200, 360, "竖图", { bg: "16a085" });

/** @type {import('../../extends/syntaxExample.js').SyntaxExample} */
export default {
  name: "images",
  desc: "行内 / 标题 / 引用式 / 不同尺寸",
  markdown: `![替代文字](${inline})

![带标题](${titled} "图片标题")

![宽图](${wide}) 与 ![竖图](${tall})

引用式图片：

![引用图][demo-img]

[demo-img]: ${ref} "引用标题"`,
  expected: "",
};
