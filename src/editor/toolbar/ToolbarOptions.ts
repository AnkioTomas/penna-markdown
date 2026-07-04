import {ToolbarItem} from "@/editor/toolbar/ToolbarItem";

export interface ToolbarOptions {
    /** 自定义/覆盖菜单项（同 id 覆盖默认项） */
    items?: ToolbarItem[];
    /** 顶层菜单 id 排序 */
    order?: string[];
    /** 子菜单 id 排序，key 为父 menu id */
    orderMap?: Record<string, string[]>;
    /** 移动端断点（px），默认 640 */
    mobileBreakpoint?: number;
}
