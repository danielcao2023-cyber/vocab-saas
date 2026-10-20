export type SoundSpellingLesson = {
 headword: string;
 ipa: string;
 chunks: {
  letters: string;
  sound: string;
  stress: 'primary' | 'secondary' | 'none';
  hint: string;
  pairs: {letters: string; sound: string}[];
  tip: string;
 }[];
 anchor: {text: string; parts?: {text: string; emphasis?: boolean}[]; formation?: string};
 uk?: string;
 variantNote?: string;
 sources: {label: string; url: string}[];
 review: {status: 'reviewed'; reviewedAt: string; draftedBy: string};
};
