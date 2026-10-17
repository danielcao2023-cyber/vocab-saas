import {it,expect} from 'vitest';
import fs from 'node:fs';
import {COPY} from '../web/src/copy.ts';
it('browse list head follows the approved mockups',()=>{
  expect(COPY.browseHead(1600,'all','zk_high')).toBe('共 1600 个 · 按中考常见程度（推断）排序');
  expect(COPY.browseHead(63,'e','daily_high')).toBe('首字母 E · 63 个 · 按日常使用频率排序');
  const view=fs.readFileSync('web/src/views/BrowseView.vue','utf8');expect(view).toContain("w.rank===null?'·':i+1");
});
it('search footer renders key caps and the word page keeps the source tab highlighted',()=>{
  expect(COPY.searchKeys.map(([k,l])=>k.join('')+l)).toEqual(['↑↓选择','Enter打开','Esc关闭']);
  expect(fs.readFileSync('web/src/components/SearchBox.vue','utf8')).toContain('<kbd v-for="k in keys"');
  expect(fs.readFileSync('web/src/App.vue','utf8')).toContain("view.value==='word'?previousView.value:view.value");
});
