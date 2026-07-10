import { EventHandler } from "@/core/event/EventHandler";
import { Log } from "@/core/Log";

/** 轻量发布/订阅事件总线 */
export class EventBus {
  private readonly listeners = new Map<string, Set<EventHandler>>();

  constructor(
    private readonly debug = false,
    private readonly logPrefix = "[cherry]",
    private readonly logger: Log,
  ) {}

  private logD(...args: unknown[]): void {
    if (!this.debug) return;
    this.logger.logD(this.logPrefix, ...args);
  }

  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    this.logD("event:on", event);
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler as EventHandler);
    return () => this.off(event, handler);
  }

  once<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    const wrapper: EventHandler<T> = (payload) => {
      unsubscribe();
      handler(payload);
    };
    const unsubscribe = this.on(event, wrapper);
    return unsubscribe;
  }

  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    this.logD("event:off", event);
    this.listeners.get(event)?.delete(handler as EventHandler);
  }

  emit<T = unknown>(event: string, payload?: T): void {
    this.logD("event:emit", event, payload);
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of [...set]) {
      (handler as EventHandler<T>)(payload as T);
    }
  }

  clear(): void {
    this.listeners.clear();
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
