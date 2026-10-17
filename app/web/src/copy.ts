/** 文案来源：v2/内容.md 修订记录 2026-10-17 09:06、09:08 定稿 */
export const COPY = {
  repeatCard: '刚才这个再来一次',
  staleCard: '页面过期了，刷新一下再继续', // 内容.md 09:14
  refresh: '刷新',
  moreSenses: '更多释义',
  collapse: '收起',
  homeRelearnNote: '刚学的词和答错的词，过几分钟会再出现',
  // v3/design：第一期批准稿新增文案。函数只替换真实数据，不引入示意数字。
  qtypes: { flip: '认词', recognize: '认词', listen_choice: '听音选义', meaning_choice: '看义选词', spell: '拼写', dictation: '听写' } as Record<string, string>,
  listenPrompt: '听到的是哪个意思？',
  meaningPrompt: '哪个词是这个意思？',
  spellPrompt: '看意思，拼出单词',
  listenHint: '戴上耳机 · 按 R 重听（不限次数）',
  audioHelp: '没听到声音？检查耳机或音量。',
  dictationPrompt: '听发音，拼出单词', // 文案审查 #10
  think: '先自己想想意思再翻面',
  spellHint: 'Tab 提示首字母 · Enter 提交',
  next: '下一个（Enter）',
  correct: '正确 ✓',
  almost: '差一点',
  spellWrong: '拼错了', // 文案审查 #3
  typed: '你写的',
  chosen: '你选的',
  addedWrong: '已加入错词本。',
  expectedChoice: (letter: string, word: string, meaning: string) => `正确答案是 ${letter}：${word} ${meaning}。已加入错词本。`,
  wrongRule: '在 3 个不同的日子答对，就会自动移出错词本。', // 文案审查 #1
  wrongPracticeNote: '练错词会先出你错过的题型。同一个词一天只算第一次练。', // 文案审查 #14
  wrongSortCount: '按错的次数',
  wrongSortRecent: '最近错的',
  wrongEmpty: '错词本是空的',
  wrongEmptyNote: '答错或点了「忘了」的词会自动放进来，在 3 个不同的日子答对就会移出。',
  // 文案审查 #15：N = 错词本里已在 2 个不同的日子答对（Good/Easy）的词，再对 1 天就移出；N=0 时不显示这半句
  nearOut: (twoDays: number) => twoDays ? `其中 ${twoDays} 个已经对了 2 天，再对 1 天就移出。` : '',
  wrongSummary: (n: number, twoDays: number) => `错词本 ${n} 个。${twoDays ? `其中 ${twoDays} 个已经对了 2 天，再对 1 天就移出。` : ''}`,
  practice: (n: number) => `练这 ${n} 个`,
  complete: '今天的任务完成了，已打卡',
  roundDone: '这一轮的词做完了。', // 文案审查 #11
  doneSummary: (answers: number, accuracy: number, mastered: number, tomorrow: number) => `今天完成 ${answers} 题，正确率 ${accuracy}%，新掌握 ${mastered} 个词。明天要复习 ${tomorrow} 个。`,
  // 文案审查 #12：本周和上周的数字并列，不算差值
  comparison: (mastered: number, previousMastered: number, accuracy: number, previousAccuracy: number) => `本周新掌握 ${mastered} 个（上周 ${previousMastered} 个）· 正确率 ${accuracy}%（上周 ${previousAccuracy}%）`,
  makeupLeft: (n: number) => `本月还可补签 ${n} 次`,
  calendarDone: '完成', calendarMakeup: '补签', calendarToday: '今天',
  earned: '已获得', remainingDays: (n: number) => `还差 ${n} 天`,
  dashboard: '学习看板', parentReadonly: '家长 · 只读',
  wrongTop: '错得最多的 20 个词', mainFailure: '主要错在',
  parentNote: '数字都来自孩子的学习记录。用时按每题作答时间累加，单题超过 5 分钟按 5 分钟算。这一页只读，不会改动任何学习数据。',
  weekReport: (days: number, minutes: number, mastered: number, wrong: string) => `本周学习 ${days} 天，共 ${minutes} 分钟，新掌握 ${mastered} 词。最常错的：${wrong}。`,
  unsaved: '这张没存上，连上后会自动补存', retry: '再试一次',
  // 以下为交互必需的补充文案，交付报告单独列出。
  checkin: '打卡', continuous: (n: number) => `连续 ${n} 天`,
  curriculumProgress: '课标进度', core: '核心词', level2: '二级词', coreNote: '初中新学', level2Note: '小学学过', // 文案审查 #18
  learningDays: '近 30 天学习天数', learningDuration: '近 30 天用时', learningAccuracy: '近 30 天正确率',
  dailyVolume: '近 30 天每天学习量', dailyAccuracy: '每天正确率', explanation: '说明',
  dataAsOf: (timestamp: string) => `数据截至 ${timestamp}（上海时间）`,
  parentFooter: '孩子的导航里没有这个入口，地址是 /parent。',
  roundSummary: (answers: number, accuracy: number) => `本轮完成 ${answers} 题，正确率 ${accuracy}%。`,
  backToday: '回到今日', // 文案审查 #13：完成页和错词本空状态统一
  makeupHint: '完成今天的任务后，就能补签没打卡的日子。', // 文案审查 #6
  // fix1 新增：补签提示随状态变化（文案审查 #7–#9 已过）
  makeupReady: '点一下没打卡的日子就能补签。',
  makeupNoneEligible: '现在没有可以补签的日子。',
  makeupUsedUp: '这个月的补签次数已用完。',
  beforeStart: '开始学习之前', missed: '未完成', future: '还没到这一天',
  noRecords: '暂无记录', removed: '已移出',
  // 第二期批准稿和内容规格；原文集中在这里。
  explain: '讲解', aiLabel: 'AI 生成 · 可能有误', expandAll: '全部展开', collapseAll: '全部收起',
  reportContent: '这条有问题', feedbackReasons: ['例句不通','意思不对','太难','其他'], feedbackSaved: '已记下，这条先不再出现。',
  feedbackTooFast: '点得有点快啦，休息一分钟再试试。', feedbackDayLimit: '今天已经提了很多条意见，谢谢你！剩下的明天再说吧。',
  contentTitles: {example:'例句',collocation:'常见搭配',distinction:'易混词',relations:'近义 · 反义',pronunciation:'发音',memory:'记忆'} as Record<string,string>,
  synonym: '近义', antonym: '反义', etymology: '词源', association: '联想 · 帮助记忆，不是词源', sameRoot: '同根词', relatedWords: '相关词', learned: '已学', outsideList: '课标外',
  explainPending: '讲解还在准备', explainPendingNote: '这个词的例句还没生成，先看释义和发音。',
  searchPlaceholder: '查单词，英文或中文', cancel: '取消', search: '查词', noSearchResults: '没找到这个词。',
  noSearchResultsNote: '课标词表里没有，或者换个拼法试试。', searchTip: '英文、中文都能查，比如 receive、收到', searchFormsTip: '过去式、复数这些变化形式也能查，比如 went、children',
  searchResults: (n:number) => `${n} 个结果`, formResults: '词形', searchKeys: [[['↑','↓'],'选择'],[['Enter'],'打开'],[['Esc'],'关闭']] as [string[],string][], searchTooLong: '最多输入 40 个字。',
  wordList: '词表', zkHigh: '中考高频', dailyHigh: '日常高频', inferred: '推断', basis: '依据：',
  zkHighNote: '中考高频排序是根据词义和用法推断的，不是真题统计。每个词的依据写在释义下面。',
  dailyHighNote: '按 COCA（美国当代英语语料库）词频排序，数据来自 ECDICT。词频库里没有的词排在最后，标「推断」。',
  unrankedNote: '这个分组还没排好，先按词表顺序显示。',
  addWrong: '加入错词本', inWrong: '在错词本里', notInWrong: '不在错词本里。', removeWrong: '移出错词本', wrongBook: '错词本',
  lookupWrongNote: '加入后会出现在“练错词”里；查词本身不算学习，不会改复习安排。',
  learningStatus: '学习状态', nextReview: '下次复习：', back: '← 返回', loadMore: '加载更多', all: '全部', levelLabel: '级别', letterLabel: '首字母',
  statuses: {new:'新词',learning:'学习中',familiar:'熟悉',mastered:'掌握'} as Record<string,string>, cardStates: ['新词','学习中','复习中','重学中'],
  noCard: '还没开始', wrongCount: (n:number)=>`错过 ${n} 次`, correctDays: (n:number)=>`${n}/3 天`, browseTotal: (n:number)=>`共 ${n} 个`,
  // 稿 p2-browse-*.html 列表头：「共 1600 个 · 按中考常见程度（推断）排序」「首字母 E · 63 个 · 按日常使用频率排序」
  browseHead: (n:number,letter:string,group:string)=>`${letter==='all'?`共 ${n} 个`:`首字母 ${String(letter).toUpperCase()} · ${n} 个`} · ${group==='zk_high'?'按中考常见程度（推断）排序':'按日常使用频率排序'}`,
  emptyLibrary: '词表还没导入，导入后这里会显示今天要学的词',
};
/** 学习中(1)/重学中(3) 且已经答过的卡 = 本轮里再次出现的卡 */
export function isRepeatCard(c: { state: number; reps?: number } | null | undefined): boolean {
  return !!c && (c.state === 1 || c.state === 3) && (c.reps ?? 0) > 0;
}
