import { TransformerEngine } from "@/transformer/TransformerEngine.js";

export function createEngine(options?: ConstructorParameters<typeof TransformerEngine>[0]) {
  return new TransformerEngine(options);
}

/** 启用增强代码块等扩展渲染行为的测试引擎。 */
export function createEnhancedEngine(
  options?: ConstructorParameters<typeof TransformerEngine>[0],
) {
  return new TransformerEngine({
    ...options,
    syntaxOptions: {
      ...options?.syntaxOptions,
      code: { enable: true, ...options?.syntaxOptions?.code },
    },
  });
}

export function renderMarkdown(
  engine: TransformerEngine,
  markdown: string,
): string {
  return engine.render(engine.parse(markdown));
}
