import { contentSchema,coreContentSchema,zkSchema } from './schema.ts';
export const CONTENT_VERSION='p2-v1',CORE_CONTENT_VERSION='p2-core-v1',ZK_VERSION='p2-zk-v1';
export type ContentProfile='full'|'core';
export function makePrompt(kind:'content'|'zk_freq',words:unknown[],curriculum:unknown[],errors:string[],profile:ContentProfile='full') {
  const rules=kind==='zk_freq'?'按词义和用法评估在中考听力、阅读、完形、写作里常见的程度，score 为一到五整数。basis_zh 不超过四十字，不得有数字、百分号、统计、真题出现、次等数量说法。一律为模型推断，不能声称有真题统计。':`面向初中课标和中考常用义；只给纯文字 JSON，不适用留空，不编造。example 数量零或二；每句六到二十个英文词、最多一百二十字符，中文最多四十字，target 为句中实际词形。collocation 零或二到三条，每条最多六词、中文十六字。distinction 零到二组，目标词加一到二个其他词，解释最多一百二十字，对比例句同例句限制。近反义各最多三条，每块课标外最多一个，按课标出词顺序优先，注释二十字以内，不可互相重叠或使用目标词词形。发音只给音节、重音下标和要点，不给音标、音频、URL。词源必须真实且置信度 high 才可能批准，不确定留空或作为联想；拆分须对应词头，解释八十字内、同根词最多四个。联想八十字以内，不得声称来自拉丁语、古英语、希腊语、源于、词源或词根是。相关词最多四个，relation 为 derivative、compound 或 same_root。不得 HTML、Markdown、表情或保证提分、必考、中考必过、贬低孩子、编造统计等说法。所有字段严格遵守 schema；word 与输入逐一对应。`;
  const core=kind==='content'&&profile==='core';
  const focus=core?'本轮只补齐核心教学内容：每词必须有恰好两句自然英文例句和二至三条真实常用搭配，不可为空。例句要有具体、日常、孩子能理解的语境，避免 I know the word X、This is the word X 等元语言或机械模板，两句体现不同语境；中文翻译忠实自然。优先输入释义中适合初中生的常用义，避免专业义、歧视或不适合儿童的内容。语法词和缩略词也用真实日常用法；斜杠词头选其主词之一，word 字段保留输入完整原文。target 必须是例句里实际出现且在词头或 forms 中的拼写。搭配是有学习价值的常用短语，不是任意拼接；sb./sth. 可以使用。其他字段必须为 schema 指定的空数组或 null；本轮不创作词源、音节或记忆口诀。':'';
  // Core does not rank related words; compact headwords avoid repeating empty forms and IDs 160 times.
  const vocabulary=core?curriculum.map(w=>({headword:(w as {headword:string}).headword})):curriculum;
  return `你是为初中生写原创英语学习内容的编辑。只返回最终 JSON，不调用工具、不读取文件、不执行命令。\n${rules}\n${focus}\n输出 schema：${JSON.stringify(kind==='content'?(core?coreContentSchema:contentSchema):zkSchema)}\n本批：${JSON.stringify(words)}\n课标词表与出词顺序：${JSON.stringify(vocabulary)}\n上次校验错误（如有，修正它们）：${errors.join('; ').slice(0,3000)}`;
}
