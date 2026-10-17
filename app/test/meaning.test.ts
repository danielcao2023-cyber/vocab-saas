import { describe, it, expect } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import fs from 'node:fs';
import MeaningList from '../web/src/MeaningList.vue';
import { splitSenses } from '../web/src/senses.ts';

const render = (meaning: string | null, flag: string | null = null) => renderToString(createSSRApp({ render: () => h(MeaningList, { meaning, flag }) }));

describe('MeaningList', () => {
  it('shows first 2 senses, rest collapsed behind 更多释义', async () => {
    expect(splitSenses('a\nb\nc\nd')).toEqual({ shown: ['a', 'b'], more: ['c', 'd'] });
    const html = await render('vt. 一\nvi. 二\nn. 三\nn. 四');
    expect(html).toContain('vt. 一'); expect(html).toContain('vi. 二');
    expect(html).not.toContain('n. 三'); // 折叠中
    expect(html).toContain('更多释义（2）');
  });
  it('no toggle when ≤2 senses; shows flag', async () => {
    const html = await render('n. 苹果', '释义待人工看');
    expect(html).not.toContain('更多释义'); expect(html).toContain('释义待人工看');
  });
  it('all three card modes use the shared component', () => {
    const app = fs.readFileSync('web/src/App.vue', 'utf8');
    expect(app.match(/<MeaningList /g)?.length).toBe(3);
    expect(app).not.toMatch(/meaning_zh \?\? '（暂无释义）'|senses\.slice/);
  });
});

import { toggleLabel } from '../web/src/senses.ts';
import { COPY } from '../web/src/copy.ts';
describe('collapse button copy (内容.md 09:14)', () => {
  it('collapsed shows count, expanded shows only 收起', () => {
    expect(toggleLabel(false, 3)).toBe('更多释义（3）');
    expect(toggleLabel(true, 3)).toBe('收起');
    const doc = fs.readFileSync('../v2/内容.md', 'utf8');
    expect(doc).toContain(`「${COPY.collapse}」`); expect(doc).toContain(`「${COPY.staleCard}」`); expect(doc).toContain(`「${COPY.refresh}」`);
    expect(fs.readFileSync('web/src/MeaningList.vue', 'utf8')).toContain('toggleLabel(open, s.more.length)');
  });
});
