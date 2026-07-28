import vue from "./answers/vue.md?raw";
import incremental from "./answers/incremental.md?raw";
import pipeline from "./answers/pipeline.md?raw";
import softmax from "./answers/softmax.md?raw";

export interface ChatTurn {
  question: string;
  answer: string;
}

/** 预置问答；输入框里的任意提问按顺序取用下一条回答 */
export const TURNS: ChatTurn[] = [
  { question: "怎么在 Vue 3 里挂载 Penna 编辑器？", answer: vue },
  { question: "流式输出为什么要做增量渲染？", answer: incremental },
  { question: "讲讲 Markdown 到 DOM 的处理流程", answer: pipeline },
  { question: "推导一下 softmax 交叉熵的梯度", answer: softmax },
];
