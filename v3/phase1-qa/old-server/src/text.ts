/** 课标 OCR 和用户输入统一使用直撇号。 */
export function normalizeQuotes(s: string): string {
  return s.replace(/[’‘ʼ]/g, "'");
}

/** 括号用于注明变体或词形；斜杠外的每段才是主词头。 */
export function mainHeadwords(s: string): string[] {
  return normalizeQuotes(s).replace(/\(.*?\)|（.*?）/g, '').split('/').map((part) => part.trim()).filter(Boolean);
}
