export type WordBook='new'|'unfamiliar'|'familiar'|'mastered';
export type LearningMode='recognize'|'spell'|'dictation';
export const BOOK_LABELS:Record<WordBook,string>={new:'生词',unfamiliar:'不熟',familiar:'熟悉',mastered:'已掌握'};
export interface LearningSummary {day:string;started:boolean;total:number;completed:number;deferred:number;newWords:number;reviewWords:number;remaining:number;backlog:number;answers:number;correct:number;books:Record<WordBook,number>}
export interface LearningCard {issueId:string;wordId:number;mode:LearningMode;headword?:string;meaning?:string;meaning_source?:string|null;promptHint?:string;audioWord?:string;audioVariant?:'noun'|'verb';patterns:string[];options:{id:number;text:string}[];assisted:boolean}
export interface LearningTurn {kind:'idle'|'card'|'waiting'|'done';summary:LearningSummary;card?:LearningCard;nextAt?:string}
export interface LearningAnswer {policyVersion?:3;issueId:string;answerId:string;answer?:string;choiceId?:number;durationMs?:number}
export interface LearningResult {correct:boolean;assisted:boolean;expected:string;meaning:string;book:WordBook;nextDue:string;duplicate?:boolean;previousBook?:WordBook}
export interface BookWord {id:number;headword:string;meaning:string;phonetic:string|null;level:string|null;book:WordBook;due:string|null}
export interface LearningBooks {book:WordBook;counts:Record<WordBook,number>;items:BookWord[];total:number;page:number;size:number}

export type EvidenceKind='probe_success'|'probe_failure'|'exposure'|'correction'|'technical_defer';
export type WordStage='new'|'consolidating'|'review';
export type LearningView='all'|'new'|'due'|'priority'|'stable'|'weak_spell'|'weak_dictation';
export interface ReviewPolicy {version:3;exposureGuardMs:number;additionalProbesPerDay:number;missingEvidenceDays:number;delayedEvidenceMs:number;initialMode:LearningMode}
export interface AttemptEvidence {correct:boolean;assisted:boolean;nowMs:number;latestExposureMs:number|null;probeAlreadySaved:boolean}
export interface EvidenceDecision {kind:'probe_success'|'probe_failure'|'correction';eligible:boolean;rating:1|3|null;reason:'independent'|'help'|'wrong'|'recent_exposure'|'already_recorded'}
export interface CapabilityNeed {cardId:number;mode:LearningMode;group:'relearn'|'due'|'missing'|'initial';dueAt:string;eligibleAt:string;lastAttemptAt:string|null}
export interface WordEvidenceState {stage:WordStage;priority:boolean;stable:boolean;dueAt:string|null;weakModes:LearningMode[]}
export interface LearningSummaryV3 extends LearningSummary {policyVersion:3;touched:number;resolved:number;needsConsolidation:number;pendingLater:number;ready:number;attempts:number;audioCooldownCount?:number;audioRetryDay?:string|null}
export interface LearningResultV3 extends LearningResult {policyVersion:3;evidenceKind:EvidenceKind;independentlyRecalled:boolean;needsConsolidation:boolean}
export interface LearningTurnV3 extends Omit<LearningTurn,'summary'> {policyVersion:3;summary:LearningSummaryV3;reason?:'resolved'|'retry_budget'|'technical_defer'|CapabilityNeed['group']}
export interface ExposureInput {policyVersion:3;wordId:number;issueId?:string;eventId:string;reason:string}
export interface ConsultInput {policyVersion:3;issueId:string;eventId:string}
export interface CapabilityEvidence {mode:LearningMode;lastAttemptAt:string|null;lastFailureAt:string|null;delayedSuccesses:number;verificationDue:string|null;dueAt:string;scheduledDays:number}
export interface EvidenceWord {id:number;headword:string;meaning:string;phonetic:string|null;level:string|null;evidenceState:WordEvidenceState}
export interface LearningViews {policyVersion:3;view:LearningView;counts:Record<LearningView,number>;items:EvidenceWord[];total:number;page:number;size:number}
