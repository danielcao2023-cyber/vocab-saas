/** 最小 CSV 解析（支持引号、转义引号、引号内逗号/换行），逐行回调 */
export function parseCsvLine(line: string): string[] {
  const out: string[] = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}
/** 判断一行是否在引号中未闭合（用于跨行记录） */
export function quotesOpen(s: string): boolean { return (s.match(/"/g)?.length ?? 0) % 2 === 1; }
