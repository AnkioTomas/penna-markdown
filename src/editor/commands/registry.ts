import type { CommandHandler } from "./types.js";

const registry = new Map<string, CommandHandler>();

export function registerCommand(name: string, handler: CommandHandler): void {
  registry.set(name, handler);
}

export function getCommand(name: string): CommandHandler | undefined {
  return registry.get(name);
}

export function listCommands(): string[] {
  return [...registry.keys()];
}
