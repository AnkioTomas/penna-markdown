export interface TocItem {
  level: number;
  text: string;
  id: string;
  children: TocItem[];
}
