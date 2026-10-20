# Adaptive Word Cards Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline with local Claude Code Coder for the bounded letter-input component. User already authorized execution; do not repeat execution-choice approval.

**Goal:** One production study flow with 40-word daily plans, three card modes, adaptive review and four live word books.

**Architecture:** Add durable learning tables alongside existing cards/logs, use existing ts-fsrs for real answers, and make the new UI the sole primary study entry. Preserve legacy APIs and history. Split selection, queue/answer transactions, routes and UI. Coder owns only LetterSlots.vue against an exact component contract.

**Tech Stack:** Existing Vue3/TypeScript/Fastify/SQLite/ts-fsrs; no new dependencies.

**Spec:** docs/superpowers/specs/2026-10-20-adaptive-word-cards.md

## Global Constraints

- Shanghai day, at most40 unique words; first assessment each mode3 consecutive successes; mastered review one probe, failure adds3 remedial successes.
- Four books and agreed downgrade rules; no progress counters inside focused card; letter underlines for dictation, lesson entry preserves turn.
- Additive migration, real server grading/idempotency, preserve logs and all existing credentials; no production writes.

### Task 1: State, daily selection and persistence (Codex)

Files: shared/learning.ts; server/src/learning/{schema,selection,engine}.ts; test/learning-engine.test.ts.
- [x] Write failing tests: `startDay(db,now)` repeated returns same40 IDs, 50 fresh words split core28/secondary12 where available; existing overdue words win and no logs created by summary.
- [x] Run `npm test -- --run test/learning-engine.test.ts` and observe failure before implementing exports.
- [x] Add schema migration called by openDb, legacy fallback states and selection with difficulty interleaving; persist day rows atomically.
- [x] Test first word nine clean answers→mastered, wrong twice→unfamiliar, same answerId replay no second log; midnight rejection and resume preserve turn.
- [x] Implement issue/answer queue with server choice grading, acceptedSpellings, FSRS update, waiting/deferred states and next-day caps.

### Task 2: Letter input (local Coder)

Files: web/src/components/LetterSlots.vue; test/letter-slots.test.ts.
- [x] Contract props `{modelValue:string;pattern:string;disabled?:boolean}`, emits `update:modelValue`, `submit`; underscore is editable letter, other pattern characters fixed. No network/storage.
- [x] Write failing tests for paste distribution, fixed punctuation, reset and disabled submit.
- [x] Give Coder one-file task and permission to run only the component test command; limit reads/time, preserve events outside repo.
- [x] Review actual changes, test and typecheck; repair defects before integration.

### Task 3: Routes and state integration (Codex)

Files: server/src/learning/routes.ts; app.ts; search.ts; word-status.ts; stats.ts; test/learning-routes.test.ts.
- [x] Route tests issue→answer→replay, invalid answers and stale IDs rejected without side effects, consult prevents pristine promotion, audio defer not counted correct.
- [x] Register /api/learning routes and share state mapping with word detail, browse and progress. Add optional new-day completion override to daily stats for active plans only.
- [x] Run new engine/routes plus existing search/stats/import tests.

### Task 4: Production UI (Codex)

Files: views/LearningHomeView.vue, LearningStudyView.vue, WordBooksView.vue; components/FocusStudyCard.vue; App.vue; test/learning-ui.test.ts.
- [x] UI failure tests for no target/phonetic leaks in dictation, no repeated-count clutter, safe consult/resume, failed submission retry keeps same question.
- [x] Connect home start/resume, per-turn server feedback, waiting refresh and audio defer. Use PendingSubmitter and cancellation guards; lesson overlays keep study component mounted.
- [x] Four books with pagination and links; same-day plan never changes when navigating books. Remove old study/practice entry from active navigation.

### Task 5: Acceptance

- [x] Run full tests, typecheck/build and diff checks; independent reviewer examines actual state/rollback/time bugs.
- [x] Back up dev database before enabling migration; browser check desktop/mobile, slots typing/paste, lesson return, book changes and paused queue.
- [x] Verify temporal paths with controlled clocks in tests; do not fabricate time passage in real DB. Commit feature branch, ask once about Wiki archive at delivery.

## Execution result — 2026-10-20

- Local Coder ran against the one-file letter-input contract for 241 seconds and was stopped at the time limit (exit143). It left only an incomplete template and did not run tests. Raw events and its draft remain outside Git in `/Users/caogong/Documents/Codex/2026-10-20/vocab-adaptive-cards-coder/`. The prompt/allowed-tools configuration did not enforce a strict shell-command sandbox; this run is not evidence of such isolation. Codex completed the component and all other integration.
- Independent review reproduced and resolved final-answer mastery statistics lag and sample cleanup foreign-key regressions. Browser QA additionally found and fixed the calendar date-load race; editing a middle dictation slot has a red-green regression and native Backspace/typing verification.
- Final checks: 69 files / 518 tests, server and Vue type checks, Vite build and diff check pass. Desktop 1280×900 / native1135×1078, mobile390×844; three card modes, paste/autofocus/correction, assisted lesson return, waiting and book changes exercised. No relevant console errors or framework overlay after fixes.
- A SQLite backup of the real dev database was made outside Git before migration, integrity_check=ok, 1600 words and zero original logs. Interactive answer QA used its disposable copy on18422; the real preview on18421 has no test learning sessions or answers. Production has not been migrated.
- Application remains on the feature branch; integration/push is a later user decision. Weekly real-user retention and production proxy setup are not validated by these local/clock-controlled tests.
