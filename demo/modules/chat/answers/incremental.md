流式场景下的渲染策略大致分三档，差别不在“快多少”，而在**会不会把已挂载的 DOM 弄丢**。

| 策略             | 每次开销  | 媒体是否重载 | 适用场景       |
| ---------------- | --------- | ------------ | -------------- |
| 整篇 `innerHTML` | O(全文)   | 每次都重载   | 一次性静态渲染 |
| 按块 diff        | O(变更块) | 不重载       | 编辑器实时预览 |
| 尾部追加         | O(尾部块) | 不重载       | AI 流式输出    |

> [!WARNING]
> 用 `innerHTML` 重刷整篇，`<iframe>` / `<video>` 会被 detach 再 attach，
> 表现就是每吐一个字视频就重新加载一次。

Penna 走的是第二、三档：解析出块级 AST 后按 `data-hash` 对齐 DOM，
只有内容真正变化的块才会被替换。

```ts title="流式追加"
const renderer = new Renderer({ mount, theme, eventBus, logger });

for await (const delta of stream) {
  renderer.append(delta); // 只重渲染尾部受影响的块
}
```

一次 `append` 的实际工作量：

- [x] 定位脏行区间，向前后找最近的稳定块边界
- [x] 只对边界内的行重新 parse
- [/] 按 hash 复用未变节点，替换变化节点
- [ ] 整篇重排（只有定义类块被改动时才会触发）
