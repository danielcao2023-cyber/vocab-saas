import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { allowedAudioLicense, commonsIdentity, recordingWordProblem, type CommonsRecording, type PronunciationSource } from './pronunciation-source.ts';

export type CachedPronunciation = PronunciationSource & { file: string; sha256: string };
export type PronunciationOverride = Partial<Pick<PronunciationSource, 'accent' | 'pronunciationNote' | 'matchedSense' | 'evidenceUrl'>> & { sourceUrl: string };

// Explicitly audited original sources and transcoded bytes. New sources require
// separate review rather than becoming trusted merely by declaring a provider.
const reviewedShtooka: Record<string, { sourceUrl: string; author: string; license: string; licenseUrl: string; sha256: string }> = {
  'in the open air': { sourceUrl: 'https://fsi-languages.yojik.eu/audiocollections/detailled/eng-balm-emmanuel/flac/eng-1748bb78.flac', author: 'Emmanuel Revah, Nicolas Vion', license: 'CC BY 2.0 FR', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/fr/', sha256: '2d7afe9871dbf5cd1d10f4e544dda14715c6a0d241326c2657b51b6c3777a9cd' },
  'in memory of': { sourceUrl: 'https://fsi-languages.yojik.eu/audiocollections/detailled/eng-balm-emmanuel/flac/eng-4ee9dfc2.flac', author: 'Emmanuel Revah, Nicolas Vion', license: 'CC BY 2.0 FR', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/fr/', sha256: 'f643626b87cb75e2a0f908bc0720640087411960a3fcd089bf6ed29297282209' },
  'in ruins': { sourceUrl: 'https://fsi-languages.yojik.eu/audiocollections/detailled/eng-balm-emmanuel/flac/eng-dc242376.flac', author: 'Emmanuel Revah, Nicolas Vion', license: 'CC BY 2.0 FR', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/fr/', sha256: 'd5dda101f61b33b5d20b26a46ee285c8a4418f7cae3dd6c112e7627d83daa222' },
  'illustrate': { sourceUrl: 'https://fsi-languages.yojik.eu/audiocollections/archives/eng-wims-mary_flac.tar.xz', author: 'Mary Maury, Bernadette Perrin-Riou, Csilla Ducrocq', license: 'CC BY 3.0 US', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/us/', sha256: '3299d94f57418c653ec620dd21df9d3a76f15d5430e16003a2dfdcbf3b85aab4' },
};

export function canReuseShtookaRecording(word: string, entry: unknown, directory: string, override?: PronunciationOverride): boolean {
  const expected = Object.hasOwn(reviewedShtooka, word) ? reviewedShtooka[word] : undefined;
  if (!expected || !entry || typeof entry !== 'object') return false;
  const r = entry as Record<string, unknown>;
  if (r.provider !== 'shtooka' || r.word !== word || Object.entries(expected).some(([key, value]) => r[key] !== value) ||
      (override && override.sourceUrl !== expected.sourceUrl) || typeof r.file !== 'string' || !/^[a-zA-Z0-9_-]+\.mp3$/.test(r.file)) return false;
  try {
    const path = join(directory, r.file);
    const stat = statSync(path);
    return stat.isFile() && stat.size > 0 && stat.size <= 2_000_000 && createHash('sha256').update(readFileSync(path)).digest('hex') === expected.sha256;
  } catch { return false; }
}

/** Reuse requires the same chosen recording and unchanged installed bytes. No network access. */
export function canReusePronunciation(word: string, entry: CachedPronunciation | undefined, directory: string,
  override?: PronunciationOverride, metadata?: Map<string, CommonsRecording>): boolean {
  // Jasper's audited file is a transcode of the source recording of the
  // common noun; its reviewed use for the Canadian place name is specific.
  if (word === 'Jasper' && entry && (entry.sourceUrl !== 'https://commons.wikimedia.org/wiki/File:En-us-jasper.ogg' ||
      entry.author !== 'Neskaya' || entry.license !== 'CC BY-SA 3.0' ||
      entry.licenseUrl !== 'https://creativecommons.org/licenses/by-sa/3.0/' ||
      entry.sha256 !== 'd2206f77db8c3a196fc02d1a1c3c8500a838f0412b4b874cc4aa49588172b65a')) return false;
  if (!entry || entry.word !== word || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.mp3$/.test(entry.file) ||
      !/^[a-f0-9]{64}$/.test(entry.sha256) || !entry.author?.trim() || /no machine-readable author|assumed/i.test(entry.author)) return false;
  if (!allowedAudioLicense(entry.licenseUrl) && !(['Public domain (PD-self)', 'Public domain (PD-user)'].includes(entry.license) && commonsIdentity(entry.sourceUrl) && entry.licenseUrl === `${entry.sourceUrl}#Licensing`)) return false;
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
