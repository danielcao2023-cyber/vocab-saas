// 工程负责人补充：看义选词题面 / 听音选义选项里不能直接露出答案词头
import { it, expect } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import ChoiceQuestion from '../web/src/components/ChoiceQuestion.vue';
const render = (props: any) => renderToString(createSSRApp({ render: () => h(ChoiceQuestion, props) }));
const card: any = { id: 1, word_id: 1, mode: 'recognize', headword: 'while', phonetic: null, meaning_zh: 'conj. 当……时；然而\nn. 一会儿（for a while）', meaning_flag: null, meaning_source: 'manual', is_sample: 0, state: 2, reps: 3, level: '三级' };
const opts = [{ wordId: 1, text: 'while' }, { wordId: 2, text: 'because' }, { wordId: 3, text: 'or' }, { wordId: 4, text: 'whether' }];
it('masks the answer headword in the meaning prompt before answering, shows it after', async () => {
  const before = await render({ card, question: { id: 9, qtype: 'meaning_choice', options: opts }, result: null, busy: false });
  const prompt = before.slice(before.indexOf('class="prompt"'), before.indexOf('class="opts"'));
  expect(prompt).toContain('for a ～'); expect(prompt).not.toMatch(/\bwhile\b/);
  expect(before).toContain('whether'); // 选项里的 whether 不受影响
});
it('masks the headword inside listen-choice option text', async () => {
  const dear: any = { ...card, headword: 'dear', meaning_zh: 'interj. 哎呀（Oh dear）' };
  const html = await render({ card: dear, question: { id: 10, qtype: 'listen_choice', options: [{ wordId: 1, text: 'interj. 哎呀（Oh dear）' }, ...opts.slice(1).map(o => ({ ...o, text: 'n. 某' }))] }, result: null, busy: false });
  expect(html).toContain('Oh ～'); expect(html).not.toMatch(/\bdear\b/);
});
