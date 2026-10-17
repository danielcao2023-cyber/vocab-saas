export interface DiffChar { char: string; changed: boolean }
/** Minimum character edits, preferring replacement for swapped letters. No HTML is generated. */
export function charDiff(typed: string, expected: string): { typed: DiffChar[]; expected: DiffChar[] } {
  const a = Array.from(typed), b = Array.from(expected);
  const dp = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i=0;i<=a.length;i++) dp[i][0]=i;
  for (let j=0;j<=b.length;j++) dp[0][j]=j;
  for(let i=1;i<=a.length;i++) for(let j=1;j<=b.length;j++) dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j-1],dp[i-1][j],dp[i][j-1]);
  const left: DiffChar[] = [], right: DiffChar[] = [];
  let i=a.length,j=b.length;
  while(i||j) {
    if(i&&j&&a[i-1]===b[j-1]) { left.unshift({char:a[--i],changed:false});right.unshift({char:b[--j],changed:false}); }
    else if(i&&j&&dp[i][j]===dp[i-1][j-1]+1) { left.unshift({char:a[--i],changed:true});right.unshift({char:b[--j],changed:true}); }
    else if(i&&dp[i][j]===dp[i-1][j]+1) left.unshift({char:a[--i],changed:true});
    else right.unshift({char:b[--j],changed:true});
  }
  return {typed:left,expected:right};
}
/** 拼写“差一点”：和正确拼写的编辑距离不超过 max(1, 长度的 30%)（4 个字母以内差 1 个，7 个字母差 2 个）。完全不沾边的答案不说“差一点”。 */
export function isNearMiss(typed: string, expected: string): boolean {
  const norm = (s: string) => s.replace(/[’‘ʼ]/g, "'").replace(/\(.*?\)|（.*?）/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
  const t = norm(typed);
  const targets = norm(expected).split('/').map(s => s.trim()).filter(Boolean);
  if (!t || !targets.length) return false;
  return targets.some(e => { const d = charDiff(t, e); const edits = Math.max(d.typed.filter(c => c.changed).length, d.expected.filter(c => c.changed).length); return edits <= Math.max(1, Math.round(Array.from(e).length * 0.3)); });
}
