import {expect, it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling/index';

// Each listed map displays a complete, unstressed tion chunk pronounced /ʃən/.
const words = ['tuition','rejection','election','operation','collection','construction','narration',
  'obligation','intention','option','institution','innovation','prediction','occupation','prohibition',
  'interaction','conventional','assumption','consumption','nutritional','nutrition','dehydration',
  'infection','intervention','aviation','qualification','ambition','adaptation','participation',
  'presentation','edition','motivation','association','moderation','duration','radiation','migration',
  'consultation','receptionist'];

it.each(words)('shows tion as a combined spelling of /ʃən/ in %s', word => {
  const chunk = getSoundSpellingLesson(word)?.chunks.find(chunk => chunk.letters === 'tion' && chunk.sound === '/ʃən/');
  expect(chunk).toBeDefined();
  expect(chunk!.pairs).toEqual([{letters:'tion',sound:'/ʃən/'}]);
});
