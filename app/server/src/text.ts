/** 课标 OCR 和用户输入统一使用直撇号。 */
export function normalizeQuotes(s: string): string {
  return s.replace(/[’‘ʼ]/g, "'");
}

// 这些教材词头省略了必需的对象；需具体语境才能测试拼写或听写。
const recognitionOnlySkeletons=new Set(['leave ... alone','take for granted','prefer ... to ...']);
/** 词典占位符或明确列出的句型骨架不适合作独立拼写、听写答案。 */
export function hasDictionaryPlaceholder(s: string): boolean {
  const normalized=normalizeQuotes(s).trim().toLowerCase().replace(/\s+/g,' ');
  return recognitionOnlySkeletons.has(normalized)||/\b(?:sb|sth)\.(?=\s|$|'s\b)/i.test(normalized);
}

/** 括号用于注明变体或词形；斜杠外的每段才是主词头。 */
export function mainHeadwords(s: string): string[] {
  return normalizeQuotes(s).replace(/\(.*?\)|（.*?）/g, '').split('/').map((part) => part.trim()).filter(Boolean);
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** 词头里可能出现在释义中的拼写：主词头、括号里的变体（AmE Ms. → Ms.） */
export function answerForms(headword: string): string[] {
  return [...new Set(normalizeQuotes(headword).split(/\s*[(/（,，)）]\s*|\bAm\s?E\b|\bpl\.\s*/).map(h => h.trim()).filter(h => h.length > 1))];
}
/**
 * 作答前遮住题面/选项里的答案：
 * 1. 答案词头及变体 → “～”（如“一会儿（for a while）”→“for a ～”）；
 * 2. 词形说明里的原形（如 lost 的“lose的过去式”）→“某词”，避免由原形反推答案。
 * 服务端出题和前端显示共用。
 */
export function maskAnswer(text: string | null | undefined, headword: string): string {
  if (!text) return text ?? '';
  let out = text;
  for (const h of answerForms(headword).sort((a, b) => b.length - a.length))
    out = out.replace(new RegExp(`(^|[^A-Za-z])${escapeRe(h).replace(/'/g, "['’‘ʼ]")}(?![A-Za-z])`, 'gi'), '$1～');
  return out.replace(/(^|[^A-Za-z])[A-Za-z][A-Za-z'-]*(\s*的\s*(?:过去式|过去分词|现在分词|复数|比较级|最高级|第三人称))/g, '$1某词$2');
}
