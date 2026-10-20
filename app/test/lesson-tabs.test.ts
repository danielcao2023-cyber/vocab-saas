import {afterEach, expect, it, vi} from 'vitest';
import {manageLesson} from '../web/src/content/lesson-samples/manage';
import {flush, host} from './p2-host';

afterEach(() => vi.unstubAllGlobals());

it('keeps supplemental pronunciation and sources exclusively in the fifth tab', async () => {
  const ui=host('web/src/components/SenseLesson.vue',{lesson:structuredClone(manageLesson)});
  try {
    expect(ui.text()).not.toContain('发音与词形变化');
    expect(ui.text()).not.toContain('参考资料');
    ui.all(n=>n.props.role==='tab'&&ui.text(n)==='再多了解一点')[0].props.onClick();await flush();
    expect(ui.text()).toContain('发音与词形变化');
    expect(ui.text()).toContain('参考资料');
    expect(ui.all(n=>n.props.role==='tabpanel')).toHaveLength(1);
    ui.all(n=>n.props.role==='tab'&&ui.text(n)==='助记办法')[0].props.onClick();await flush();
    expect(ui.text()).not.toContain('发音与词形变化');
  } finally {ui.app.unmount();}
});

it('shows one lesson panel and changes it without scrolling or changing history', async () => {
  const ui = host('web/src/components/SenseLesson.vue', {lesson: structuredClone(manageLesson)});
  const pushState = vi.fn();
  vi.stubGlobal('history', {pushState});
  try {
    const tabs = () => ui.all(n => n.props.role === 'tab');
    const panels = () => ui.all(n => n.props.role === 'tabpanel');
    expect(tabs()).toHaveLength(5);
    expect(tabs().filter(n => String(n.props['aria-selected']) === 'true').map(n => ui.text(n))).toEqual(['义项与用法']);
    expect(panels()).toHaveLength(1);
    const selected = tabs().find(n => String(n.props['aria-selected']) === 'true')!;
    expect(Number(selected.props.tabindex)).toBe(0);
    expect(selected.props['aria-controls']).toBe(panels()[0].props.id);
    expect(ui.text(panels()[0])).not.toContain(manageLesson.memoryAid.story);
    tabs().find(n => ui.text(n) === '助记办法')!.props.onClick();
    await flush();
    expect(panels()).toHaveLength(1);
    expect(ui.text(panels()[0])).toContain(manageLesson.memoryAid.story);
    expect(panels()[0].props['aria-labelledby']).toBe(tabs().find(n => String(n.props['aria-selected']) === 'true')!.props.id);
    expect(pushState).not.toHaveBeenCalled();
  } finally { ui.app.unmount(); }
});

it('resets to usage when the lesson changes to another word', async () => {
  const ui = host('web/src/components/SenseLesson.vue', {lesson: structuredClone(manageLesson)});
  try {
    ui.all(n => n.props.role === 'tab' && ui.text(n) === '助记办法')[0].props.onClick();
    await flush();
    ui.updateProps({lesson: {...structuredClone(manageLesson), id: 'lesson-next', wordId: 999, headword: 'next'}});
    await flush();
    expect(ui.all(n => n.props.role === 'tab' && String(n.props['aria-selected']) === 'true').map(n => ui.text(n))).toEqual(['义项与用法']);
    expect(ui.all(n => n.props.role === 'tabpanel')).toHaveLength(1);
  } finally { ui.app.unmount(); }
});

it('supports arrow and boundary keys within its own tablist', async () => {
  const ui = host('web/src/components/SenseLesson.vue', {lesson: structuredClone(manageLesson)});
  try {
    const tabs = ui.all(n => n.props.role === 'tab');
    expect(tabs).toHaveLength(5);
    const buttons = tabs.map(n => ({id: n.props.id, focus: vi.fn()}));
    const parentElement = {querySelectorAll: vi.fn(() => buttons)};
    for (const [from, key, to] of [[0, 'ArrowRight', 1], [1, 'End', 4], [4, 'Home', 0], [0, 'ArrowLeft', 4]] as const) {
      const preventDefault = vi.fn();
      tabs[from].props.onKeydown({key, currentTarget: {...buttons[from], parentElement}, preventDefault});
      await flush();
      expect(preventDefault).toHaveBeenCalledOnce();
      expect(buttons[to].focus).toHaveBeenCalledWith({preventScroll: true});
      expect(String(tabs[to].props['aria-selected'])).toBe('true');
      expect(Number(tabs[to].props.tabindex)).toBe(0);
      expect(tabs.filter(n => Number(n.props.tabindex) === 0)).toHaveLength(1);
    }
  } finally { ui.app.unmount(); }
});
