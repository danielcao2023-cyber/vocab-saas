/** 一行一个义项；卡片先显示前 2 条，其余折叠 */
export function splitSenses(meaning: string | null | undefined, shown = 2) {
  const all = (meaning ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
  return { shown: all.slice(0, shown), more: all.slice(shown) };
}
