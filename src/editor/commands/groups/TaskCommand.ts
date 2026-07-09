/**
 * 任务列表命令组。
 * GFM 任务列表及扩展状态标记。
 */
import { SnippetCommand } from "@/editor/commands/groups/SnippetCommand";
import { LinePrefixCommand } from "@/editor/commands/groups/LinePrefixCommand";

/** `taskList` — 未完成任务项，`- [ ] 任务` */
export const taskListCommand = new SnippetCommand("- [ ] 任务", 6, 8);
/** `taskInProgress` — 进行中，`- [/] 进行中` */
export const taskInProgressCommand = new SnippetCommand("- [/] 进行中", 6, 9);
/** `taskDeferred` — 延期，`- [>] 延期` */
export const taskDeferredCommand = new SnippetCommand("- [>] 延期", 6, 8);
/** `taskEarly` — 提前完成，`- [<] 提前` */
export const taskEarlyCommand = new SnippetCommand("- [<] 提前", 6, 8);
/** `taskCancelled` — 已取消，`- [-] 已取消` */
export const taskCancelledCommand = new SnippetCommand("- [-] 已取消", 6, 9);
/** `taskUrgent` — 紧急，`- [!] 紧急` */
export const taskUrgentCommand = new SnippetCommand("- [!] 紧急", 6, 8);
