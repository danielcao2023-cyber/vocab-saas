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
