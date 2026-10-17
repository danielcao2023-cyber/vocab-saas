import { shDay } from './time.ts';
/**
 * 反馈接口的进程内限流（每个实例一份，重启清零）：
 * - 每分钟最多 10 次请求（滑动 60 秒窗口，被拒的请求不计入）；
 * - 每个上海自然日最多 30 次成功隐藏。
 * 超限返回 'minute' / 'day'，调用方回 429 且不改库。
 */
export const FEEDBACK_LIMITS = { perMinute: 10, hidesPerDay: 30 };
export function feedbackLimiter(limits = FEEDBACK_LIMITS) {
  const attempts: number[] = []; let day = '', hides = 0;
  const roll = (t: Date) => { const d = shDay(t); if (d !== day) { day = d; hides = 0; } };
  return {
    check(t: Date): 'minute' | 'day' | null {
      const ms = t.getTime(); while (attempts.length && attempts[0] <= ms - 60_000) attempts.shift();
      if (attempts.length >= limits.perMinute) return 'minute';
      roll(t); if (hides >= limits.hidesPerDay) return 'day';
      attempts.push(ms); return null;
    },
    hid(t: Date) { roll(t); hides++; },
  };
}
export const LIMIT_ERRORS = { minute: 'too many feedback requests', day: 'daily feedback limit reached' } as const;
