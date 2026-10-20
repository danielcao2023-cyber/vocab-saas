export interface Card { id: number; word_id: number; mode: 'recognize' | 'spell' | 'dictation'; headword: string; phonetic: string | null; meaning_zh: string | null; meaning_flag: string | null; meaning_source: string | null; is_sample: number; state: number; reps: number; level: string | null }
export interface Question { id: number; qtype: 'listen_choice' | 'meaning_choice'; prompt?: string; options: { wordId: number; text: string }[] }
export interface Turn { card: Card; question: Question | null }
export interface ChoiceResult { correct: boolean; answerWordId: number; chosenWordId: number; expected: { headword: string; phonetic: string | null; meaning_zh: string | null; meaning_source: string | null }; chosen: { headword: string; meaning_first_line: string } }
export interface Tier { total: number; new: number; learning: number; familiar: number; mastered: number }
export interface Curriculum { core: Tier; level2: Tier }
export interface Streak { current: number; best: number; calendar: { day: string; status: string }[]; badges: { days: number; earned: boolean; progress: number }[]; makeupLeft: number; makeupUsed: number; makeupCandidates: string[]; makeupBlocked?: Record<string, string>; todayDone?: boolean }
export interface Today { day: string; review: number; new: number; minutes: number; completed: boolean; streak: number; stats: { answers: number; accuracy: number | null }; masteredNew: number; tomorrowReview: number; comparison: { thisWeek: { masteredNew: number; accuracy: number | null }; previousWeek: { masteredNew: number; accuracy: number | null } } | null }
export interface WrongWord { word_id: number; headword: string; phonetic: string | null; meaning_zh: string | null; wrong_count: number; last_wrong_at: string; correct_days: number; fails: Record<string,number> }
export interface WrongBook { items: WrongWord[]; total: number; twoCorrectDays: number }
export type LearningStatus='新词'|'学习中'|'熟悉'|'掌握'|'生词'|'不熟'|'已掌握';
export interface ContentBlock {id:number;kind:string;body:any;flags:string[];label:string}
export interface WordContent {status:'ready'|'pending';blocks:ContentBlock[]}
export interface SearchItem {id:number;headword:string;phonetic:string|null;firstMeaning:string;level:string|null;status:LearningStatus;inWrongBook:boolean;formMatch?:{form:string;kind:string;description:string}}
export interface BrowseItem extends SearchItem {rank:number|null;basis:string;isInferred:boolean}
export interface BrowseResult {items:BrowseItem[];total:number;page:number;size:number;group:string;coverage:{ranked:number;total:number}}
export interface WordDetail {word:{id:number;headword:string;phonetic:string|null;pos:string|null;meaning_zh:string|null;meaning_source:string|null;meaning_flag:string|null;level:string|null;source:string};status:LearningStatus;statusDetail:Record<'recognize'|'spell'|'dictation',{state:number;due:string}|null>;wrong:{inBook:boolean;wrong_count:number;correct_days:string[]}|null;content:WordContent}
