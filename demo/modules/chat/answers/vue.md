在 Vue 3 里挂载 Penna 只要三步：**拿到 DOM、创建实例、卸载时销毁**。

::: tip 💡 提示
`Penna` 自带主题、工具栏与增量预览，组件里不需要再包一层状态管理。
:::

```vue title="PennaEditor.vue" {8,14}
<script setup lang="ts">
import { onMounted, onBeforeUnmount, shallowRef } from "vue";
import { Penna } from "penna-markdown";

const host = shallowRef<HTMLElement | null>(null);
let editor: Penna | null = null;

onMounted(() => {
  editor = new Penna({ mount: host.value!, value: "# Hello" });
});

onBeforeUnmount(() => {
  editor?.destroy();
  editor = null;
});
</script>

<template>
  <div ref="host" class="penna-host" />
</template>
```

几个容易踩的坑：

- [x] 用 `shallowRef` 持有实例，别丢进 `ref`，否则 Vue 会深度代理整棵编辑器状态
- [x] 宿主容器必须有确定高度，`height: 100%` 的父级要一路给到位
- [ ] SSR 场景下把挂载逻辑放进 `onMounted`，`Penna` 依赖 `document`

| 选项    | 说明           | 默认值    |
| ------- | -------------- | --------- |
| `mount` | 宿主元素，必填 | —         |
| `value` | 初始 Markdown  | `""`      |
| `theme` | 皮肤 id        | `default` |
