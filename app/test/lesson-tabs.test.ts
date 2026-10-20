import {afterEach, expect, it, vi} from 'vitest';
import {manageLesson as originalManageLesson} from '../web/src/content/lesson-samples/manage';
const manageLesson={...originalManageLesson,headword:'unmapped-test-fixture'};
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

it('defaults government to sound-spelling while keeping other words on the existing five tabs',async()=>{
 const government={...structuredClone(manageLesson),id:'lesson-government',wordId:600,headword:'government'};
 const play=vi.fn(),ui=host('web/src/components/SenseLesson.vue',{lesson:government,onPlay:play});
 try{const tabs=()=>ui.all(n=>n.props.role==='tab');expect(tabs()).toHaveLength(6);expect(tabs().filter(n=>String(n.props['aria-selected'])==='true').map(n=>ui.text(n))).toEqual(['发音与拼写']);
  expect(ui.all(n=>n.props.role==='tabpanel')).toHaveLength(1);expect(ui.text()).toContain('gov');expect(ui.text()).toContain('ern');expect(ui.text()).toContain('ment');expect(ui.text()).toContain('/ɚ/');
  ui.all(n=>n.tag==='button'&&ui.text(n).includes('听整词录音'))[0].props.onClick();expect(play).toHaveBeenCalledOnce();
  tabs().find(n=>ui.text(n)==='义项与用法')!.props.onClick();await flush();expect(ui.text()).not.toContain('听整词录音');
  ui.updateProps({lesson:structuredClone(manageLesson)});await flush();expect(tabs()).toHaveLength(5);expect(tabs().filter(n=>String(n.props['aria-selected'])==='true').map(n=>ui.text(n))).toEqual(['义项与用法']);
 }finally{ui.app.unmount();}
});

it('includes the new first tab in keyboard navigation and resets when government is opened',async()=>{
 const ui=host('web/src/components/SenseLesson.vue',{lesson:structuredClone(manageLesson)});
 try{ui.updateProps({lesson:{...structuredClone(manageLesson),id:'government',wordId:600,headword:'government'}});await flush();
  const tabs=ui.all(n=>n.props.role==='tab'),buttons=tabs.map(n=>({id:n.props.id,focus:vi.fn()})),parentElement={querySelectorAll:()=>buttons};
  tabs[0].props.onKeydown({key:'End',currentTarget:{...buttons[0],parentElement},preventDefault(){}});await flush();expect(tabs[5].props['aria-selected']).toBe('true');
  tabs[5].props.onKeydown({key:'ArrowRight',currentTarget:{...buttons[5],parentElement},preventDefault(){}});await flush();expect(tabs[0].props['aria-selected']).toBe('true');
 }finally{ui.app.unmount();}
});

it('opens a reviewed multisyllabic word with its own sound map and highlights its stressed segment',async()=>{
 const ui=host('web/src/components/SenseLesson.vue',{lesson:{...structuredClone(manageLesson),id:'important',wordId:693,headword:'important'}});
 try{
  expect(ui.all(n=>n.props.role==='tab'&&String(n.props['aria-selected'])==='true').map(n=>ui.text(n))).toEqual(['发音与拼写']);
  const chunks=ui.all(n=>n.tag==='button'&&String(n.props.class).includes('sound-chunk'));
  expect(chunks.map(n=>ui.text(n).includes('重读'))).toEqual([false,true,false]);
  expect(ui.text()).toContain('por');expect(ui.text()).not.toContain('govern');
  chunks[1].props.onClick();await flush();expect(ui.text()).toContain('por：怎么从声音想到字母');
 }finally{ui.app.unmount();}
});

it('resets segment selection when navigating from a four-segment word to a shorter sound map',async()=>{
 const ui=host('web/src/components/SenseLesson.vue',{lesson:{...structuredClone(manageLesson),id:'education',wordId:431,headword:'education'}});
 try{
  const chunks=()=>ui.all(n=>n.tag==='button'&&String(n.props.class).includes('sound-chunk'));
  expect(chunks()).toHaveLength(4);chunks()[3].props.onClick();await flush();
  expect(ui.text()).toContain('tion：怎么从声音想到字母');
  ui.updateProps({lesson:{...structuredClone(manageLesson),id:'action',wordId:16,headword:'action'}});await flush();
  expect(chunks()).toHaveLength(2);expect(ui.text()).toContain('ac：怎么从声音想到字母');expect(ui.text()).not.toContain('gov');
  expect(ui.all(n=>n.props.role==='tabpanel')).toHaveLength(1);
 }finally{ui.app.unmount();}
});

it('switches each mixed-headword map independently and requests the selected recording',async()=>{
 const play=vi.fn();
 const ui=host('web/src/components/SenseLesson.vue',{lesson:{...structuredClone(manageLesson),id:'actor-mixed',wordId:19,headword:'actor / actress'},onPlay:play});
 try{
  expect(ui.all(n=>n.props.role==='tab'&&String(n.props['aria-selected'])==='true').map(n=>ui.text(n))).toEqual(['发音与拼写']);
  const actress=ui.all(n=>n.tag==='button'&&n.props['aria-label']==='拼写对照 actress')[0];
  expect(actress).toBeDefined();actress.props.onClick();await flush();
  expect(ui.text()).toContain('actress');
  ui.all(n=>n.tag==='button'&&ui.text(n).includes('听整词录音'))[0].props.onClick();
  expect(play).toHaveBeenCalledWith('actress');
  ui.updateProps({lesson:{...structuredClone(manageLesson),id:'able-map',wordId:3,headword:'able'}});await flush();
  ui.all(n=>n.tag==='button'&&ui.text(n).includes('听整词录音'))[0].props.onClick();
  expect(play).toHaveBeenLastCalledWith('able');
 }finally{ui.app.unmount();}
});

it('preserves the curriculum spelling case when playing a lower-case indexed map',async()=>{
 const play=vi.fn(),ui=host('web/src/components/SenseLesson.vue',{lesson:{...structuredClone(manageLesson),id:'Chinese-map',wordId:0,headword:'Chinese'},onPlay:play});
 try{ui.all(n=>n.tag==='button'&&ui.text(n).includes('听整词录音'))[0].props.onClick();expect(play).toHaveBeenCalledWith('Chinese');}
 finally{ui.app.unmount();}
});

it('labels the real recording accent independently of the spelling-map transcription',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({status:'ready',accent:'uk',pronunciationNote:'地铁名词，重读首音节。'}))));
 const ui=host('web/src/components/SoundSpellingLesson.vue',{lesson:{headword:'underground',ipa:'/ˈʌndəɡraʊnd/',chunks:[{letters:'under',sound:'/ʌndə/',stress:'primary',hint:'',tip:'',pairs:[]}],anchor:{text:''},sources:[]}});
 try{await flush();expect(ui.text()).toContain('英式录音');expect(ui.text()).toContain('地铁名词，重读首音节。');expect(ui.text()).not.toContain('听美式');}
 finally{ui.app.unmount();}
});
