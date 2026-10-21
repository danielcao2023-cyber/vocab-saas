import type {
  ReviewPolicy,
  AttemptEvidence,
  EvidenceDecision,
  CapabilityNeed,
  LearningMode,
} from '../../../shared/learning.ts';

export const REVIEW_POLICY: ReviewPolicy = {
  version: 3,
  exposureGuardMs: 300000,
  additionalProbesPerDay: 2,
  missingEvidenceDays: 3,
  delayedEvidenceMs: 86400000,
  initialMode: 'spell',
};

export function classifyEvidence(
  input: AttemptEvidence,
  policy: ReviewPolicy
): EvidenceDecision {
  const { correct, assisted, nowMs, latestExposureMs, probeAlreadySaved } = input;
  const { exposureGuardMs } = policy;

  // First probeAlreadySaved check
  if (probeAlreadySaved) {
    return {
      kind: 'correction',
      eligible: false,
      rating: null,
      reason: 'already_recorded',
    };
  }

  // Then assisted check
  if (assisted) {
    return {
      kind: 'probe_failure',
      eligible: true,
      rating: 1,
      reason: 'help',
    };
  }

  // Then latestExposure within guard (including future)
  if (latestExposureMs !== null && nowMs - latestExposureMs < exposureGuardMs) {
    return {
      kind: 'correction',
      eligible: false,
      rating: null,
      reason: 'recent_exposure',
    };
  }

  // Then correct check
  if (correct) {
    return {
      kind: 'probe_success',
      eligible: true,
      rating: 3,
      reason: 'independent',
    };
  }

  // Probe failure for wrong answer
  return {
    kind: 'probe_failure',
    eligible: true,
    rating: 1,
    reason: 'wrong',
  };
}

export function chooseCapability(needs: CapabilityNeed[], now: Date): CapabilityNeed | null {
 const group={missing:0,relearn:1,due:2,initial:3},mode={spell:0,dictation:1,recognize:2};
 return needs.filter(n=>Date.parse(n.dueAt)<=+now&&Date.parse(n.eligibleAt)<=+now).sort((a,b)=>
  group[a.group]-group[b.group] ||
  (a.group==='missing'&&b.group==='missing' ? (a.lastAttemptAt===null?-Infinity:Date.parse(a.lastAttemptAt))-(b.lastAttemptAt===null?-Infinity:Date.parse(b.lastAttemptAt)) : 0) ||
  Date.parse(a.dueAt)-Date.parse(b.dueAt)||mode[a.mode]-mode[b.mode]||a.cardId-b.cardId)[0]??null;
}
