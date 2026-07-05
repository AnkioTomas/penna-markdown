/** CM Transaction 反馈的变更行号（1-based，首尾均含）。 */
export interface CherryChangeLineSet {
  fromA: number;
  toA: number;
  fromB: number;
  toB: number;
}
