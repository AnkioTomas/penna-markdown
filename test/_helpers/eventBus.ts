import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";

/** 测试用 EventBus，补齐构造参数 */
export function createTestEventBus(debug = false): EventBus {
  const log = new Log(debug);
  return new EventBus(debug, "[test]", log);
}
