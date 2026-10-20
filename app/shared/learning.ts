export type WordBook='new'|'unfamiliar'|'familiar'|'mastered';
export type LearningMode='recognize'|'spell'|'dictation';
export const BOOK_LABELS:Record<WordBook,string>={new:'生词',unfamiliar:'不熟',familiar:'熟悉',mastered:'已掌握'};
export interface LearningSummary {day:string;started:boolean;total:number;completed:number;deferred:number;newWords:number;reviewWords:number;remaining:number;backlog:number;answers:number;correct:number;books:Record<WordBook,number>}
export interface LearningCard {issueId:string;wordId:number;mode:LearningMode;headword?:string;meaning?:string;meaning_source?:string|null;audioWord?:string;patterns:string[];options:{id:number;text:string}[];assisted:boolean}
export interface LearningTurn {kind:'idle'|'card'|'waiting'|'done';summary:LearningSummary;card?:LearningCard;nextAt?:string}
export interface LearningAnswer {issueId:string;answerId:string;answer?:string;choiceId?:number;durationMs?:number}
export interface LearningResult {correct:boolean;assisted:boolean;expected:string;meaning:string;book:WordBook;nextDue:string;duplicate?:boolean;previousBook?:WordBook}
export interface BookWord {id:number;headword:string;meaning:string;phonetic:string|null;level:string|null;book:WordBook;due:string|null}
export interface LearningBooks {book:WordBook;counts:Record<WordBook,number>;items:BookWord[];total:number;page:number;size:number}
