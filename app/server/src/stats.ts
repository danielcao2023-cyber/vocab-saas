import type { DB } from './db.ts';
import { State, createEmptyCard, fsrs, type Grade, type Card } from 'ts-fsrs';
import { shDay, shDayStart } from './time.ts';
import { setting } from './settings.ts';

const DAY = 86400_000;
export const shiftDay = (day: string, n: number) => new Date(Date.parse(day + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10);
export const weekStart = (day: string) => shiftDay(day, -((new Date(day + 'T00:00:00Z').getUTCDay() + 6) % 7));
interface Log { id: number; card_id: number; rating: number; state: number; due: string; stability: number; review_at: string; counted: number | null; duration_ms: number | null; correct: number | null; difficulty: number; elapsed_days: number; scheduled_days: number; qtype: string | null }
interface Snapshot { id: number; word_id: number; mode: string; state: number; due: string; stability: number }
export interface DailyStat { day: string; new_count: number; review_count: number; practice_count: number; answers: number; correct: number; duration_ms: number; mastered_new: number; completed: number; completed_at: string | null; computed_at: string }

function history(db: DB) {
  const cards = db.prepare('SELECT id,word_id,mode,state,due,stability FROM cards').all() as Snapshot[];
  const logs = db.prepare('SELECT * FROM review_logs ORDER BY review_at,id').all() as Log[];
  const byCard = new Map<number, Log[]>();
  const byDay = new Map<string, Log[]>();
  const introduced = new Map<number, string>();
  const mode = new Map(cards.map(c => [c.id, c]));
  for (const log of logs) {
    const day = shDay(new Date(log.review_at));
    const dayLogs = byDay.get(day) ?? [];dayLogs.push(log);byDay.set(day,dayLogs);
    if (log.counted === 0) continue;
    const list = byCard.get(log.card_id) ?? []; list.push(log); byCard.set(log.card_id, list);
    const c = mode.get(log.card_id)!;
    if (c.mode === 'recognize' && !introduced.has(c.word_id)) introduced.set(c.word_id, log.review_at);
  }
  // ts-fsrs 5.x writes the previous last_review as log.due for every non-New state (Learning, Review, Relearning),
  // not the pre-answer due. Old rows are immutable; replay FSRS to recover the real pre-answer due whenever the
  // legacy signature (qtype NULL and due === previous review_at) is present.
  const legacyDue = new Map<number, string>();
  const scheduler = fsrs({ enable_fuzz: false });
  for (const list of byCard.values()) {
    if (!list.some((next, i) => i > 0 && next.qtype === null && next.state !== State.New && next.due === list[i - 1].review_at)) continue;
    let replay: Card | undefined;
    for (let i = 0; i < list.length; i++) {
      const l = list[i], previous = list[i - 1];
      const pre: Card = { ...createEmptyCard(new Date(l.due)), ...(replay ?? {}), state: l.state, stability: l.stability, difficulty: l.difficulty, elapsed_days: l.elapsed_days, scheduled_days: l.scheduled_days,
        due: new Date(l.due), last_review: previous ? new Date(previous.review_at) : undefined };
      replay = scheduler.next(pre, new Date(l.review_at), l.rating as Grade).card;
      const next = list[i + 1];
      if (next && next.qtype === null && next.state !== State.New && next.due === l.review_at) legacyDue.set(next.id, replay.due.toISOString());
    }
  }
  return { cards, logs, byCard, byDay, cardById: mode, introduced, legacyDue, words: (db.prepare('SELECT COUNT(*) n FROM words').get() as { n: number }).n };
}
type History = ReturnType<typeof history>;
function queueAt(db: DB, h: History, at: Date) {
  const t = at.toISOString(), start = shDayStart(at).toISOString();
  let due = 0, learned = 0, reviews = 0, newToday = 0;
  for (const c of h.cards) {
    const intro = h.introduced.get(c.word_id);
    if (c.mode !== 'recognize' && intro && intro > t) continue;
    const logs = h.byCard.get(c.id) ?? [];
    let lo = 0, hi = logs.length;
    while (lo < hi) { const mid = (lo + hi) >>> 1; if (logs[mid].review_at <= t) lo = mid + 1; else hi = mid; }
    const next = logs[lo];
    const hasPrevious = lo > 0;
    let state = next?.state ?? c.state;
    let dueAt = next ? (h.legacyDue.get(next.id) ?? next.due) : c.due;
    if (!hasPrevious && next && c.mode !== 'recognize' && intro) {
      state = State.New;
      dueAt = new Date(shDayStart(new Date(intro)).getTime() + DAY).toISOString();
    }
    if (c.mode === 'recognize' && state !== State.New) learned++;
    if ((state !== State.New || c.mode !== 'recognize') && dueAt <= t) due++;
  }
  for (const log of h.byDay.get(shDay(at)) ?? []) {
    if (log.counted === 0 || log.review_at < start || log.review_at > t) continue;
    if (log.state !== State.New) reviews++;
    else if (h.cardById.get(log.card_id)?.mode === 'recognize') newToday++;
  }
  return { review: Math.min(due, Math.max(0, setting(db, 'review_limit', 200) - reviews)), new: Math.min(Math.max(0, h.words - learned), Math.max(0, setting(db, 'new_per_day', 10) - newToday)) };
}
/** Reconstruct post-answer state. Only counted logs carry FSRS transitions; log.due is the pre-answer due. */
export function queueStateAt(db: DB, at: Date) { return queueAt(db, history(db), at); }

export function recomputeDailyStats(db: DB, days?: string[]) {
  const h = history(db);
  const wanted = new Set(days ?? h.byDay.keys());
  const modes = new Map(h.cards.map(c => [c.id, c.mode]));
  const current = new Map(h.cards.map(c => [c.id, c]));
  const after = new Map<number, number>();
  for (const [id, logs] of h.byCard) logs.forEach((l, i) => after.set(l.id, logs[i + 1]?.stability ?? current.get(id)!.stability));
  const durationCap = setting(db, 'duration_cap_ms', 300000);
  const upsert = db.prepare(`INSERT INTO daily_stats(day,new_count,review_count,practice_count,answers,correct,duration_ms,mastered_new,completed,completed_at,computed_at)
    VALUES (@day,@new_count,@review_count,@practice_count,@answers,@correct,@duration_ms,@mastered_new,@completed,@completed_at,@computed_at)
    ON CONFLICT(day) DO UPDATE SET new_count=excluded.new_count,review_count=excluded.review_count,practice_count=excluded.practice_count,answers=excluded.answers,correct=excluded.correct,duration_ms=excluded.duration_ms,mastered_new=excluded.mastered_new,completed=excluded.completed,completed_at=excluded.completed_at,computed_at=excluded.computed_at`);
  db.transaction(() => {
    for (const day of wanted) {
      const logs = h.byDay.get(day) ?? [];
      if (!logs.length) continue;
      const stat: DailyStat = { day, new_count: 0, review_count: 0, practice_count: 0, answers: logs.length, correct: 0, duration_ms: 0, mastered_new: 0, completed: 0, completed_at: null, computed_at: logs.at(-1)!.review_at };
      const crossed = new Set<number>(); let last: Log | undefined;
      for (const l of logs) {
        if (l.counted === 0) stat.practice_count++;
        else {
          last = l;
          if (l.state !== State.New) stat.review_count++;
          else if (modes.get(l.card_id) === 'recognize') stat.new_count++;
          if (modes.get(l.card_id) === 'recognize' && l.stability < 21 && after.get(l.id)! >= 21) crossed.add(l.card_id);
        }
        stat.correct += l.correct === null ? Number(l.rating > 1) : Number(!!l.correct);
        stat.duration_ms += Math.min(Math.max(0, l.duration_ms ?? 0), durationCap);
      }
      stat.mastered_new = crossed.size;
      if (last) {
        const q = queueAt(db, h, new Date(last.review_at));
        if (q.review === 0 && q.new === 0) { stat.completed = 1; stat.completed_at = last.review_at; }
      }
      upsert.run(stat);
    }
  })();
}

function streakData(db: DB, now: Date) {
  const done = new Set((db.prepare('SELECT day FROM daily_stats WHERE completed=1 UNION SELECT day FROM streak_makeups').all() as { day: string }[]).map(r => r.day));
  const today = shDay(now);
  let current = 0, best = 0, run = 0, previous = '';
  for (const day of [...done].filter(d => d <= today).sort()) { run = previous && shiftDay(previous, 1) === day ? run + 1 : 1; best = Math.max(best, run); previous = day; }
  for (let day = done.has(today) ? today : shiftDay(today, -1); done.has(day); day = shiftDay(day, -1)) current++;
  const first = (db.prepare('SELECT MIN(review_at) first FROM review_logs').get() as { first: string | null }).first;
  return { done, current, best, firstDay: first ? shDay(new Date(first)) : null };
}
function makeupReason(db: DB, day: string, now: Date, data = streakData(db, now)): string | null {
  const today = shDay(now);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(Date.parse(day)) || new Date(day).toISOString().slice(0, 10) !== day) return '补签日期无效';
  if (day >= today) return '只能补签今天之前的日子';
  if (!data.firstDay || day < data.firstDay) return '不能补签开始学习之前的日子';
  if (data.done.has(day)) return '这一天已完成或已补签';
  if (day < shiftDay(today, -setting(db, 'makeup_window_days', 7))) return '这一天太久了，不能补签'; // 文案审查 #16
  const used = (db.prepare('SELECT COUNT(*) n FROM streak_makeups WHERE substr(day,1,7)=?').get(day.slice(0, 7)) as { n: number }).n;
  if (used >= setting(db, 'makeup_per_month', 2)) return '这个月的补签次数已用完';
  if (setting(db, 'makeup_requires_today', 1) && !(db.prepare('SELECT 1 FROM daily_stats WHERE day=? AND completed=1').get(today))) return '先完成今天的任务才能补签';
  return null;
}
export function streak(db: DB, now = new Date(), month = shDay(now).slice(0, 7)) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('月份无效');
  const data = streakData(db, now), today = shDay(now);
  const makeups = new Set((db.prepare('SELECT day FROM streak_makeups').all() as { day: string }[]).map(r => r.day));
  const calendar: { day: string; status: string }[] = [];
  for (let day = month + '-01'; day.slice(0, 7) === month; day = shiftDay(day, 1)) {
    const status = day > today ? 'future' : (!data.firstDay || day < data.firstDay) ? (day === today ? 'today' : 'before_start') : makeups.has(day) ? 'makeup' : data.done.has(day) ? 'done' : day === today ? 'today' : 'missed';
    calendar.push({ day, status });
  }
  const used = [...makeups].filter(d => d.startsWith(month)).length;
  return { current: data.current, best: data.best, calendar, badges: [7, 30, 100].map(days => ({ days, earned: data.best >= days, progress: Math.min(data.current, days) })), makeupLeft: Math.max(0, setting(db, 'makeup_per_month', 2) - used), makeupUsed: used,
    makeupCandidates: calendar.filter(d => !makeupReason(db, d.day, now, data)).map(d => d.day),
    // 漏签但现在不能补的日子 → 原因（前端点击时说明）；今天是否已完成（补签提示随状态变化）
    makeupBlocked: Object.fromEntries(calendar.filter(d => d.status === 'missed').map(d => [d.day, makeupReason(db, d.day, now, data)]).filter(([, r]) => r)) as Record<string, string>,
    todayDone: !!db.prepare('SELECT 1 FROM daily_stats WHERE day=? AND completed=1').get(today) };
}
export function makeup(db: DB, day: string, now = new Date()) {
  db.transaction(() => {
    const reason = makeupReason(db, day, now); if (reason) throw new Error(reason);
    db.prepare('INSERT INTO streak_makeups(day,used_at) VALUES (?,?)').run(day, now.toISOString());
  })();
  return streak(db, now, day.slice(0, 7));
}

export function curriculumProgress(db: DB) {
  const group = (level: string) => {
    const r = db.prepare(`SELECT COUNT(*) total,
      COALESCE(SUM(c.id IS NULL OR c.state=0),0) AS new,
      COALESCE(SUM(c.state IN (1,3) OR (c.state=2 AND c.stability<7)),0) learning,
      COALESCE(SUM(c.state=2 AND c.stability>=7 AND c.stability<21),0) familiar,
      COALESCE(SUM(c.state=2 AND c.stability>=21),0) mastered
      FROM words w LEFT JOIN cards c ON c.word_id=w.id AND c.mode='recognize' WHERE w.source='kb2022' AND w.level=?`).get(level) as { total: number; new: number; learning: number; familiar: number; mastered: number };
    return r;
  };
  return { core: group('三级'), level2: group('二级') };
}
export function parentSummary(db: DB, now = new Date(), days = 30) {
  if (!Number.isInteger(days) || days < 1 || days > 366) throw new Error('天数应在 1 到 366 之间');
  const today = shDay(now);
  recomputeDailyStats(db, [today]);
  const all = db.prepare('SELECT * FROM daily_stats WHERE day<=? ORDER BY day').all(today) as DailyStat[];
  const byDay = new Map(all.map(r => [r.day, r]));
  const makeups = new Set((db.prepare('SELECT day FROM streak_makeups').all() as { day: string }[]).map(r => r.day));
  const daily = Array.from({ length: days }, (_, i) => {
    const day = shiftDay(today, i - days + 1), r = byDay.get(day);
    return { day, new: r?.new_count ?? 0, review: r?.review_count ?? 0, practice: r?.practice_count ?? 0, answers: r?.answers ?? 0, correct: r?.correct ?? 0, accuracy: r?.answers ? r.correct / r.answers : null, durationMs: r?.duration_ms ?? 0, completed: !!r?.completed, makeup: makeups.has(day) };
  });
  const aggregate = (start: string, end = today) => {
    const rows = all.filter(r => r.day >= start && r.day <= end);
    const sum = (key: 'answers' | 'correct' | 'duration_ms' | 'new_count' | 'mastered_new') => rows.reduce((s, r) => s + r[key], 0);
    const answers = sum('answers');
    return { studyDays: rows.filter(r => r.answers > 0).length, durationMs: sum('duration_ms'), minutes: sum('duration_ms') / 60000, new: sum('new_count'), masteredNew: sum('mastered_new'), answers, correct: sum('correct'), accuracy: answers ? sum('correct') / answers : null };
  };
  const totals = { ...aggregate(shiftDay(today, 1 - days)), last7: aggregate(shiftDay(today, -6)), thisWeek: aggregate(weekStart(today)), previousWeek: aggregate(shiftDay(weekStart(today), -7), shiftDay(weekStart(today), -1)) };
  const wrongTop20 = (db.prepare(`SELECT w.headword,ww.wrong_count,ww.last_wrong_at,ww.removed_at IS NULL inBook,
    (SELECT COALESCE(l.qtype,CASE c.mode WHEN 'recognize' THEN 'flip' ELSE c.mode END) FROM review_logs l JOIN cards c ON c.id=l.card_id
     WHERE c.word_id=w.id AND (l.correct=0 OR l.rating=1) GROUP BY COALESCE(l.qtype,CASE c.mode WHEN 'recognize' THEN 'flip' ELSE c.mode END)
     ORDER BY COUNT(*) DESC,MAX(l.review_at) DESC LIMIT 1) topQtype
    FROM wrong_words ww JOIN words w ON w.id=ww.word_id ORDER BY ww.wrong_count DESC,ww.last_wrong_at DESC LIMIT 20`).all() as any[]).map(r => ({ ...r, inBook: !!r.inBook }));
  const s = streak(db, now);
  return { daily, totals, streak: { current: s.current, best: s.best, makeupUsed: s.makeupUsed }, wrongTop20, progress: curriculumProgress(db), generatedAt: now.toISOString() };
}
