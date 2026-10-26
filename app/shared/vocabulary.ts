export interface VocabularySelection {bookId:string;unitId:string|null}
export interface VocabularyUnit {id:string;title:string;position:number;wordCount:number}
export interface VocabularyBook {id:string;title:string;category:string;edition:string;sourceUrl:string;wordCount:number;units:VocabularyUnit[]}
export interface VocabularyState {selection:VocabularySelection;activeSelection:VocabularySelection;effectiveOn:string|null;books:VocabularyBook[];wordCount:number}
export const DEFAULT_VOCABULARY:VocabularySelection={bookId:'kb2022',unitId:null};
