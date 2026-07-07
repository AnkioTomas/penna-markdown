export interface GfmCase {
  id: number;
  example: number;
  markdown: string;
  html: string;
  section: string;
  extensions?: string[];
  start_line?: number;
  end_line?: number;
}

export interface GfmCaseResult {
  ok: boolean;
  actualHtml: string;
  message?: string;
}
