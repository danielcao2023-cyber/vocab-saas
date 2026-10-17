import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { allowedAudioLicense, commonsIdentity, recordingWordProblem, type CommonsRecording, type PronunciationSource } from './pronunciation-source.ts';

export type CachedPronunciation = PronunciationSource & { file: string; sha256: string };
export type PronunciationOverride = Partial<Pick<PronunciationSource, 'accent' | 'pronunciationNote' | 'matchedSense' | 'evidenceUrl'>> & { sourceUrl: string };

/** Reuse requires the same chosen recording and unchanged installed bytes. No network access. */
export function canReusePronunciation(word: string, entry: CachedPronunciation | undefined, directory: string,
  override?: PronunciationOverride, metadata?: Map<string, CommonsRecording>): boolean {
  if (!entry || entry.word !== word || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.mp3$/.test(entry.file) ||
      !/^[a-f0-9]{64}$/.test(entry.sha256) || !entry.author?.trim() || /no machine-readable author|assumed/i.test(entry.author)) return false;
  if (!allowedAudioLicense(entry.licenseUrl) && !(entry.license === 'Public domain (PD-self)' && commonsIdentity(entry.sourceUrl) && entry.licenseUrl === `${entry.sourceUrl}#Licensing`)) return false;
  const entryIdentity = commonsIdentity(entry.sourceUrl);
  const record = entryIdentity ? metadata?.get(entryIdentity) : undefined;
  const actualTitle = record?.title ?? (entryIdentity?.startsWith('title:') ? entryIdentity.slice(6) : undefined);
  if (!actualTitle || recordingWordProblem(word, actualTitle, { sourceUrl: override?.sourceUrl ?? entry.sourceUrl,
    evidenceUrl: override?.evidenceUrl ?? entry.evidenceUrl })) return false;
  if (override) {
    const identity = commonsIdentity(override.sourceUrl);
    if (!identity) return false;
    // Official redirects may have changed a filename while preserving the exact recording.
    const expected = metadata?.get(identity)?.sourceUrl ?? override.sourceUrl;
    if (commonsIdentity(entry.sourceUrl) !== commonsIdentity(expected)) return false;
  }
  try {
    const path = join(directory, entry.file);
    const stat = statSync(path);
    if (!stat.isFile() || stat.size === 0 || stat.size > 2_000_000) return false;
    return createHash('sha256').update(readFileSync(path)).digest('hex') === entry.sha256;
  } catch { return false; }
}
