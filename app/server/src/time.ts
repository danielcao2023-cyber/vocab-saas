/** 上海时间的日期字符串 YYYY-MM-DD（每日队列按上海时间 0 点切换） */
export function shDay(d: Date): string {
  return new Date(d.getTime() + 8 * 3600_000).toISOString().slice(0, 10);
}
/** 上海时间当天 0 点对应的 UTC Date */
export function shDayStart(d: Date): Date {
  return new Date(Date.parse(shDay(d) + 'T00:00:00Z') - 8 * 3600_000);
}
