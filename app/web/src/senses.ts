import { COPY } from './copy';
/** 一行一个义项；卡片先显示前 2 条，其余折叠 */
export function splitSenses(meaning: string | null | undefined, shown = 2) {
  const all = (meaning ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
  return { shown: all.slice(0, shown), more: all.slice(shown) };
}

/** 折叠按钮文字：收起状态带计数，展开后只写“收起” */
export function toggleLabel(open: boolean, moreCount: number): string {
  return open ? COPY.collapse : `${COPY.moreSenses}（${moreCount}）`;
}
