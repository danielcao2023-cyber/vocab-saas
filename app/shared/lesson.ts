/** Shared transport contract for a complete, sense-based word lesson. */
export interface LessonExample {
  id: string;
  senseId: string;
  en: string;
  zh: string;
  note?: string;
}

export interface LessonUsage {
  en: string;
  zh: string;
  note: string;
  kind: 'sentence-pattern' | 'common-collocation' | 'fixed-expression';
}

export interface RelatedExpression {
  en: string;
  zh: string;
  note: string;
}

export interface LessonSense {
  id: string;
  title: string;
  meaning: string;
  usageNote: string;
  examples: LessonExample[];
  patterns: LessonUsage[];
  collocations: LessonUsage[];
  relatedExpressions: {
    similar: RelatedExpression[];
    contrasting: RelatedExpression[];
    /** Explain why no useful equivalent exists instead of inventing a relation. */
    similarNote?: string;
    contrastingNote?: string;
  };
  sourceIds: string[];
}

export interface WordLesson {
  schemaVersion: 1;
  wordId: number;
  id: string;
  headword: string;
  partOfSpeech: string;
  headline: string;
  takeaway: string;
  levelHint: string;
  studyPlan: string[];
  pronunciation: {
    ipa: string;
    uk: string;
    us: string;
    accentNote: string;
    notes: string[];
    sourceIds: string[];
  };
  forms: { label: string; form: string; ipa: string; note: string }[];
  senses: LessonSense[];
  lessCommonSenses: {
    id: string;
    title: string;
    meaning: string;
    note: string;
    example: LessonExample;
    sourceIds: string[];
  }[];
  confusions: {
    id: string;
    title: string;
    summary: string;
    items: { label: string; note: string; example: LessonExample }[];
    takeaway: string;
    sourceIds: string[];
  }[];
  etymology: {
    summary: string;
    stages: { language: string; form: string; meaning: string }[];
    caveat: string;
    sourceIds: string[];
  };
  wordFamily: {
    word: string;
    partOfSpeech: string;
    meaning: string;
    formation: string;
    spellingNote: string;
    example: LessonExample;
    sourceIds: string[];
  }[];
  wordFamilyNote?: string;
  memoryAid: {
    title: string;
    story: string;
    caveat: string;
    cues: { label: string; text: string }[];
  };
  sources: LessonSource[];
  editorial: {
    status: 'draft' | 'reviewed';
    authorship: string;
    scope: string;
    checkedAt: string;
  };
}

export type LessonSource = {
  id: string;
  title: string;
  url: string;
  supports: string[];
} & (
  | { verification: 'verified'; checkedAt: string }
  | { verification: 'recommended'; checkedAt?: never }
);

export type WordLessonResponse =
  | { status: 'ready'; lesson: WordLesson }
  | { status: 'pending'; lesson: null };
