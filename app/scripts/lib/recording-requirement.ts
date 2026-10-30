export type AudioExemption = 'phrase' | 'abbreviation' | 'proper-name' | 'transliteration';
export type RecordingRequirement = 'word' | AudioExemption;

/** Coverage policy only: never removes entries or existing audio.
 * Unknown single tokens stay required; capitalization alone is not an exemption.
 */
export function recordingRequirement(
  headword: string,
  reviewedExemptions: Readonly<Record<string, AudioExemption>>,
): RecordingRequirement {
  const word = headword.trim();
  if (Object.hasOwn(reviewedExemptions, word)) return reviewedExemptions[word]!;
  return /\s/u.test(word) ? 'phrase' : 'word';
}
