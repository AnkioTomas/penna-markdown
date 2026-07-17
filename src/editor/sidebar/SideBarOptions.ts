export interface PennaFileItem {
  /** 文件唯一标识 */
  id: string;
  /** 文件名称 */
  title: string;
  /** 更新时间字符串 */
  updateTime: string;
  /** 简介或前文预览片段 */
  summary: string;
}

export interface SideBarOptions {
  /** 侧栏最大宽度（px），默认 300 */
  maxWidth?: number;
  /** 异步获取文件列表的钩子，如果未提供，则只显示大纲面板 */
  fetchFiles?: () => Promise<PennaFileItem[]>;
  /** 点击文件列表项时的回调 */
  onFileClick?: (fileId: string) => void;
}
