/** 文案来源：v2/内容.md 修订记录 2026-10-17 09:06、09:08 定稿 */
export const COPY = {
  repeatCard: '刚才这个再来一次',
  staleCard: '页面过期了，刷新一下再继续', // 内容.md 09:14
  refresh: '刷新',
  moreSenses: '更多释义',
  collapse: '收起',
  homeRelearnNote: '刚学的词和答错的词，过几分钟会再出现',
};
/** 学习中(1)/重学中(3) 且已经答过的卡 = 本轮里再次出现的卡 */
export function isRepeatCard(c: { state: number; reps?: number } | null | undefined): boolean {
  return !!c && (c.state === 1 || c.state === 3) && (c.reps ?? 0) > 0;
}
