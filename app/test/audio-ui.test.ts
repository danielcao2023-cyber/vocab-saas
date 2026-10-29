import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {manageLesson} from '../web/src/content/lesson-samples/manage';
import { COPY } from '../web/src/copy.ts';
import type { Card, Turn, WordDetail } from '../web/src/types.ts';
import { mockAudio, MockAudio } from './audio-fixtures.ts';
import { flush, host } from './p2-host.ts';

const card: Card = { id: 1, word_id: 1, mode: 'recognize', headword: 'receive', phonetic: null, meaning_zh: 'v. 收到', meaning_source: 'manual', meaning_flag: null, is_sample: 0, state: 0, reps: 0, level: '三级' };
const listening: Turn = { card, question: { id: 1, qtype: 'listen_choice', options: [{ wordId: 1, text: '收到' }, { wordId: 2, text: '接受' }] } };
const wordDetail = (id = 1, headword = 'receive'): WordDetail => ({
  word: { ...card, id, headword, pos: 'v.', source: 'kb2022' }, status: '新词',
  statusDetail: { recognize: null, spell: null, dictation: null }, wrong: null,
  content: { status: 'pending', blocks: [] },
});

beforeEach(() => {
  mockAudio();
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"status":"missing"}', { status: 200 })));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it('StudyView explains blocked autoplay and a manual click retries the real recording', async () => {
  MockAudio.start = () => Promise.reject(Object.assign(new Error('User gesture required'), { name: 'NotAllowedError' }));
  const ui = host('web/src/views/StudyView.vue', { prefer: 'review', practice: [listening], estimate: 1 });
  try {
    await flush();
    expect(ui.text()).toContain(COPY.audioBlocked);
    expect(ui.text()).not.toContain(COPY.audioUnavailable);
    expect(ui.text()).not.toContain('receive');
    const credits = ui.all(n => n.tag === 'a' && ui.text(n) === COPY.audioCredits)[0];
    expect(credits.props.href).toBe('/api/pronunciation/credits');
    MockAudio.start = async audio => { audio.emit('playing'); };
    ui.all(n => n.tag === 'button' && ui.text(n) === COPY.audioRetry)[0].props.onClick();
    await flush();
    expect(MockAudio.instances).toHaveLength(2);
    expect(MockAudio.instances[1].src).toBe('/api/pronunciation/audio?word=receive');
    expect(ui.text()).not.toContain(COPY.audioBlocked);
    MockAudio.instances[1].emit('ended');
    await flush();
    expect(ui.text()).not.toContain(COPY.audioUnavailable);
  } finally { ui.app.unmount(); }
});

it('StudyView cancels playback when advancing, and late failures cannot overwrite the next card', async () => {
  let rejectOld!: (error: Error) => void;
  MockAudio.start = () => new Promise((_, reject) => { rejectOld = reject; });
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"status":"pending","blocks":[]}', { status: 200 })));
  const next = { ...card, id: 2, word_id: 2, headword: 'accept' };
  const ui = host('web/src/views/StudyView.vue', { prefer: 'review', practice: [{ card, question: null }, { card: next, question: null }], estimate: 2 });
  try {
    await flush(); ui.key('r'); await flush();
    const oldAudio = MockAudio.instances[0];
    expect(oldAudio.src).toContain('receive');
    ui.key('Enter'); await flush(); ui.key('3'); await flush();
    expect(ui.text()).toContain('accept');
    expect(oldAudio.pause).toHaveBeenCalledOnce();
    expect(oldAudio.src).toBe('');
    rejectOld(new Error('late network error')); oldAudio.emit('error');
    await flush();
    expect(ui.text()).not.toContain(COPY.audioUnavailable);
    expect(ui.text()).not.toContain(COPY.audioBlocked);
  } finally { ui.app.unmount(); }
});

it('StudyView cancels playback on pause and unmount without showing an audio failure', async () => {
  const cancel = vi.fn();
  const ui = host('web/src/views/StudyView.vue', { prefer: 'review', practice: [listening], estimate: 1, onCancel: cancel });
  await flush();
  const audio = MockAudio.instances[0];
  ui.key('Escape'); await flush();
  expect(cancel).toHaveBeenCalledOnce();
  expect(audio.pause).toHaveBeenCalledOnce();
  expect(ui.text()).not.toContain(COPY.audioUnavailable);
  ui.app.unmount();
  expect(audio.pause).toHaveBeenCalledOnce();
});

it('WordView shows an honest unavailable message after media failure and clears it when retrying', async () => {
  const ui = host('web/src/views/WordView.vue', { wordId: 1, initial: wordDetail() });
  try {
    await flush();
    ui.all(n => n.props['aria-label'] === '听发音')[0].props.onClick();
    MockAudio.instances[0].emit('error'); await flush();
    expect(ui.text()).toContain(COPY.audioUnavailable);
    expect(ui.text()).not.toContain('检查耳机或音量');
    ui.all(n => n.tag === 'button' && ui.text(n) === COPY.audioRetry)[0].props.onClick();
    await flush();
    expect(MockAudio.instances).toHaveLength(2);
    expect(ui.text()).not.toContain(COPY.audioUnavailable);
    MockAudio.instances[1].emit('ended'); await flush();
    expect(ui.text()).not.toContain(COPY.audioUnavailable);
  } finally { ui.app.unmount(); }
});

it('WordView cancels on word changes and unmount, ignores old failures and links the exact main headword credits', async () => {
  let rejectOld!: (error: Error) => void;
  MockAudio.start = () => new Promise((_, reject) => { rejectOld = reject; });
  vi.stubGlobal('fetch', vi.fn(async (url:string) => new Response(JSON.stringify(url.startsWith('/api/pronunciation?')?{status:'ready'}:wordDetail(2, 'US / us')), { status: 200 })));
  const ui = host('web/src/views/WordView.vue', { wordId: 1, initial: wordDetail() });
  try {
    await flush();
    ui.all(n => n.props['aria-label'] === '听发音')[0].props.onClick();
    const oldAudio = MockAudio.instances[0];
    ui.updateProps({ wordId: 2 }); await flush();
    expect(oldAudio.pause).toHaveBeenCalledOnce();
    expect(oldAudio.src).toBe('');
    expect(ui.text()).toContain('US / us');
    expect(ui.all(n => n.tag === 'a' && ui.text(n) === COPY.audioCredits)[0].props.href).toBe('/api/pronunciation/credits?word=US');
    rejectOld(new Error('late error')); oldAudio.emit('error'); await flush();
    expect(ui.text()).not.toContain(COPY.audioUnavailable);
    MockAudio.start = async audio => { audio.emit('playing'); };
    ui.all(n => n.props['aria-label'] === '听发音')[0].props.onClick();
  } finally { ui.app.unmount(); }
  expect(MockAudio.instances[1].pause).toHaveBeenCalledOnce();
  expect(MockAudio.instances[1].src).toBe('');
});

it('WordView loads the optional pronunciation note independently while the word and playback remain usable', async () => {
  let resolveMetadata!: (response: Response) => void;
  vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { resolveMetadata = resolve; })));
  const ui = host('web/src/views/WordView.vue', { wordId: 1, initial: wordDetail(1, 'live') });
  try {
    expect(ui.text()).toContain('live');
    ui.all(n => n.props['aria-label'] === '听发音')[0].props.onClick();
    expect(MockAudio.instances[0].src).toBe('/api/pronunciation/audio?word=live');
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/pronunciation?word=live', undefined);
    resolveMetadata(new Response(JSON.stringify({ status: 'ready', pronunciationNote: '动词 live /lɪv/（生活、居住）。' })));
    await flush();
    expect(ui.all(n => n.props['aria-label'] === '发音说明').map(n => ui.text(n))).toEqual(['动词 live /lɪv/（生活、居住）。']);
    expect(MockAudio.instances[0].pause).not.toHaveBeenCalled();
  } finally { ui.app.unmount(); }
});

it('WordView keeps the newest pronunciation note when old metadata arrives after a word change', async () => {
  let resolveOld!: (response: Response) => void;
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url === '/api/pronunciation?word=receive') return new Promise<Response>(resolve => { resolveOld = resolve; });
    if (url === '/api/pronunciation?word=US') return new Response('{"status":"ready","pronunciationNote":"缩写 US 的美式录音。"}');
    return new Response(JSON.stringify(wordDetail(2, 'US / us')));
  }));
  const ui = host('web/src/views/WordView.vue', { wordId: 1, initial: wordDetail() });
  try {
    ui.updateProps({ wordId: 2 }); await flush();
    expect(ui.text()).toContain('缩写 US 的美式录音。');
    expect(ui.all(n=>n.tag==='a'&&ui.text(n)===COPY.audioCredits)[0].props.href).toBe('/api/pronunciation/credits?word=US');
    resolveOld(new Response('{"status":"ready","pronunciationNote":"旧单词的录音说明。"}')); await flush();
    expect(ui.text()).not.toContain('旧单词的录音说明。');
    expect(ui.all(n=>n.tag==='a'&&ui.text(n)===COPY.audioCredits)[0].props.href).toBe('/api/pronunciation/credits?word=US');
    expect(ui.text()).toContain('缩写 US 的美式录音。');
  } finally { ui.app.unmount(); }
});

it('WordView metadata failure does not become a word-loading or playback error', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network unavailable'); }));
  const ui = host('web/src/views/WordView.vue', { wordId: 1, initial: wordDetail() });
  try {
    await flush();
    expect(ui.text()).toContain('receive');
    expect(ui.all(n => n.props['aria-label'] === '发音说明')).toHaveLength(0);
    expect(ui.all(n=>n.tag==='a'&&ui.text(n)===COPY.audioCredits)).toHaveLength(0);
    expect(ui.text()).not.toContain(COPY.retry);
    expect(ui.text()).not.toContain(COPY.audioUnavailable);
    ui.all(n => n.props['aria-label'] === '听发音')[0].props.onClick();
    expect(MockAudio.instances[0].play).toHaveBeenCalledOnce();
  } finally { ui.app.unmount(); }
});

it('cancels the previous recording when switching a mixed spelling map and ignores late failures',async()=>{
 let rejectOld!:(error:Error)=>void;
 MockAudio.start=()=>new Promise((_,reject)=>{rejectOld=reject;});
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>new Response(JSON.stringify(url==='/api/word/1/lesson'
  ?{status:'ready',lesson:{...structuredClone(manageLesson),wordId:1,id:'mixed',headword:'actor / actress'}}
  :{status:'ready',accent:'us'}))));
 const ui=host('web/src/views/WordView.vue',{wordId:1,initial:wordDetail(1,'actor / actress')});
 try{await flush();
  ui.all(n=>n.tag==='button'&&ui.text(n).includes('听整词录音'))[0].props.onClick();await flush();
  const old=MockAudio.instances[0];
  ui.all(n=>n.props['aria-label']==='拼写对照 actress')[0].props.onClick();await flush();
  expect(old.pause).toHaveBeenCalledOnce();expect(old.src).toBe('');
  rejectOld(new Error('old recording failed'));old.emit('error');await flush();
  expect(ui.text()).not.toContain(COPY.audioUnavailable);
 }finally{ui.app.unmount();}
});

it('WordView exposes labelled pronunciation variants and retries the selected variant',async()=>{
 vi.stubGlobal('fetch',vi.fn(async (url:string)=>new Response(JSON.stringify(url.includes('/api/pronunciation?')?{status:'missing',word:'estimate',variants:[{variant:'noun',label:'名词',ipa:'/ˈestɪmət/',pronunciationNote:'加拿大英语'},{variant:'verb',label:'动词',ipa:'/ˈestɪmeɪt/'}]}:{status:'missing'}),{status:200})));
 const ui=host('web/src/views/WordView.vue',{wordId:1,initial:wordDetail(1,'estimate')});
 try{await flush();const noun=ui.all(n=>n.tag==='button'&&ui.text(n).includes('名词'))[0];expect(noun).toBeDefined();expect(ui.text()).toContain('/ˈestɪmət/');expect(ui.text()).toContain('加拿大英语');noun.props.onClick();await flush();expect(MockAudio.instances[0].src).toContain('variant=noun');MockAudio.instances[0].emit('error');await flush();ui.all(n=>n.tag==='button'&&ui.text(n)===COPY.audioRetry)[0].props.onClick();await flush();expect(MockAudio.instances[1].src).toContain('variant=noun');MockAudio.instances[1].emit('ended');await flush();}finally{ui.app.unmount()}
});


it('WordView associates the main pronunciation with the recording and displays meaning labels',async()=>{
 vi.stubGlobal('fetch',vi.fn(async (url:string)=>new Response(JSON.stringify(url.includes('/api/pronunciation?')?{status:'ready',ipa:'/boʊ/',variants:[{variant:'noun',label:'弓、蝴蝶结'},{variant:'verb',label:'鞠躬、船首'}]}:{status:'missing'}),{status:200})));
 const ui=host('web/src/views/WordView.vue',{wordId:1,initial:{...wordDetail(1,'bow'),word:{...wordDetail(1,'bow').word,phonetic:'/baʊ/'}}});
 try {await flush();expect(ui.text()).toContain('/boʊ/');expect(ui.text()).not.toContain('/baʊ/');expect(ui.text()).toContain('弓、蝴蝶结');expect(ui.all(n=>n.props['aria-label']==='不同词性发音')).toHaveLength(0);}finally{ui.app.unmount()}
});

it('WordView only shows recording credits for ready audio or usable variants',async()=>{
 for(const [data,visible] of [[{status:'missing'},false],[{status:'ready',accent:'us'},true],[{status:'missing',variants:[{variant:'noun',label:'名词'}]},true]] as const){
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>new Response(JSON.stringify(url.startsWith('/api/pronunciation?')?data:{status:'missing'}))));
  const ui=host('web/src/views/WordView.vue',{wordId:1,initial:wordDetail()});try{await flush();expect(ui.all(n=>n.tag==='a'&&ui.text(n)===COPY.audioCredits).length).toBe(visible?1:0)}finally{ui.app.unmount()}
 }
});
it('WordView does not carry old audio credits to a missing or failed next word',async()=>{
 let pending!:(r:Response)=>void;
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>{if(url==='/api/pronunciation?word=receive')return new Response('{"status":"ready"}');if(url==='/api/pronunciation?word=US')return new Promise<Response>(resolve=>pending=resolve);return new Response(JSON.stringify(wordDetail(2,'US / us')))}));
 const ui=host('web/src/views/WordView.vue',{wordId:1,initial:wordDetail()});try{await flush();expect(ui.all(n=>n.tag==='a'&&ui.text(n)===COPY.audioCredits)).toHaveLength(1);ui.updateProps({wordId:2});await flush();expect(ui.all(n=>n.tag==='a'&&ui.text(n)===COPY.audioCredits)).toHaveLength(0);pending(new Response('{"status":"missing"}'));await flush();expect(ui.all(n=>n.tag==='a'&&ui.text(n)===COPY.audioCredits)).toHaveLength(0)}finally{ui.app.unmount()}
});
it('WordView labels successful system speech and hides a formerly ready recording credit',async()=>{
 class Utterance {text:string;lang='';rate=1;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(text:string){this.text=text;}}
 let utterance:Utterance|undefined;
 vi.stubGlobal('SpeechSynthesisUtterance',Utterance);vi.stubGlobal('speechSynthesis',{getVoices:()=>[{lang:'en-US',localService:true}],speak:(u:Utterance)=>{utterance=u},cancel:vi.fn()});
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>new Response(JSON.stringify(url.startsWith('/api/pronunciation?')?{status:'ready'}:{status:'missing'}))));
 const ui=host('web/src/views/WordView.vue',{wordId:1,initial:wordDetail()});try{await flush();expect(ui.all(n=>n.tag==='a'&&ui.text(n)===COPY.audioCredits)).toHaveLength(1);ui.all(n=>n.props['aria-label']==='听发音')[0].props.onClick();MockAudio.instances[0].emit('error');await flush();expect(utterance).toBeDefined();utterance!.onend!();await flush();expect(ui.text()).toContain('系统合成发音');expect(ui.text()).toContain('口音可能与音标不同');expect(ui.all(n=>n.tag==='a'&&ui.text(n)===COPY.audioCredits)).toHaveLength(0)}finally{ui.app.unmount()}
});
it('WordView explains an incomplete skeleton when the recording is missing',async()=>{
 const synth={getVoices:()=>[],speak:vi.fn(),cancel:vi.fn()};vi.stubGlobal('speechSynthesis',synth);vi.stubGlobal('SpeechSynthesisUtterance',class {constructor(public text:string){}});
 const ui=host('web/src/views/WordView.vue',{wordId:1,initial:wordDetail(1,'range from ... to ...')});try{await flush();ui.all(n=>n.props['aria-label']==='听发音')[0].props.onClick();MockAudio.instances[0].emit('error');await flush();expect(ui.text()).toContain(COPY.audioIncomplete);expect(synth.speak).not.toHaveBeenCalled();expect(ui.all(n=>n.tag==='button'&&ui.text(n)===COPY.audioRetry)).toHaveLength(0)}finally{ui.app.unmount()}
});
it('mixed-word panel credits the selected empress recording, not emperor',async()=>{
 const {createLessonReader}=await import('../server/src/lessons');const lesson=createLessonReader()({id:443,headword:'emperor / empress'}).lesson!;
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>{const word=url.includes('word=empress')?'empress':'emperor';return new Response(JSON.stringify(url.includes('/lesson')?{status:'ready',lesson}:url.startsWith('/api/pronunciation?')?{status:'ready',word,accent:'us'}:{status:'missing'}))}));
 const ui=host('web/src/views/WordView.vue',{wordId:443,initial:wordDetail(443,'emperor / empress')});try{await flush();ui.all(n=>n.props['aria-label']==='拼写对照 empress')[0].props.onClick();await flush();ui.all(n=>n.tag==='button'&&ui.text(n).includes('听整词录音'))[0].props.onClick();await flush();expect(MockAudio.instances[0].src).toContain('word=empress');expect(ui.all(n=>n.tag==='a'&&ui.text(n).includes('录音来源')).map(n=>n.props.href)).toContain('/api/pronunciation/credits?word=empress');}finally{ui.app.unmount()}
});

it('mixed-word panel reports system fallback for the selected word without hiding main credits',async()=>{
 const {createLessonReader}=await import('../server/src/lessons');const lesson=createLessonReader()({id:443,headword:'emperor / empress'}).lesson!;
 class Utterance {text:string;lang='';rate=1;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(text:string){this.text=text;}}
 let utterance:Utterance|undefined;vi.stubGlobal('SpeechSynthesisUtterance',Utterance);vi.stubGlobal('speechSynthesis',{getVoices:()=>[{lang:'en-US',localService:true}],speak:(u:Utterance)=>{utterance=u},cancel:vi.fn()});
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>new Response(JSON.stringify(url.includes('/lesson')?{status:'ready',lesson}:{status:'ready',accent:'us'}))));
 const ui=host('web/src/views/WordView.vue',{wordId:443,initial:wordDetail(443,'emperor / empress')});try{await flush();ui.all(n=>n.props['aria-label']==='拼写对照 empress')[0].props.onClick();await flush();ui.all(n=>n.tag==='button'&&ui.text(n).includes('听整词录音'))[0].props.onClick();MockAudio.instances[0].emit('error');await flush();expect(utterance?.text).toBe('empress');utterance!.onend!();await flush();const links=ui.all(n=>n.tag==='a'&&ui.text(n).includes('录音来源')).map(n=>n.props.href);expect(links).toContain('/api/pronunciation/credits?word=emperor');expect(links).not.toContain('/api/pronunciation/credits?word=empress');expect(ui.text()).toContain('系统合成发音')}finally{ui.app.unmount()}
});
it('discount word page displays the actual recording IPA ahead of the stale verb IPA',async()=>{
 const {createLessonReader}=await import('../server/src/lessons');const lesson=createLessonReader()({id:2092,headword:'discount'}).lesson!;
 const detail=wordDetail(2092,'discount');detail.word.phonetic='[dɪˈskaʊnt]';detail.word.meaning_zh='n. 折扣\nvt. 打折';
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>new Response(JSON.stringify(url.includes('/lesson')?{status:'ready',lesson}:url.startsWith('/api/pronunciation?')?{status:'ready',ipa:'/ˈdɪskaʊnt/',pronunciationNote:'录音为动词读音。'}:{status:'missing'}))));
 const ui=host('web/src/views/WordView.vue',{wordId:2092,initial:detail});try{await flush();const phon=ui.all(n=>n.props.class==='phon');expect(phon.length).toBeGreaterThan(0);expect(ui.text(phon[0])).toContain('/ˈdɪskaʊnt/');expect(ui.text(phon[0])).not.toContain('[dɪˈskaʊnt]');ui.all(n=>n.props['aria-label']==='听发音')[0].props.onClick();expect(MockAudio.instances[0].src).toContain('word=discount')}finally{ui.app.unmount()}
});

for(const mobile of [false,true])it(`${mobile?'offline':'online'} WordView displays the exact synthesized placeholder expansion`,async()=>{
 class Utterance {text:string;lang='';rate=1;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(text:string){this.text=text;}}
 let spoken:Utterance|undefined;vi.stubGlobal('__VOCAB_MOBILE__',mobile);vi.stubGlobal('__VOCAB_RECORDINGS__',{});
 vi.stubGlobal('SpeechSynthesisUtterance',Utterance);vi.stubGlobal('speechSynthesis',{getVoices:()=>[],speak:(u:Utterance)=>{spoken=u},cancel:vi.fn()});
 const ui=host('web/src/views/WordView.vue',{wordId:1,initial:wordDetail(1,'sign up for sth.')});
 try{await flush();ui.all(n=>n.props['aria-label']==='听发音')[0].props.onClick();if(!mobile)MockAudio.instances[0].emit('error');await flush();expect(spoken?.text).toBe('sign up for something');spoken!.onend!();await flush();expect(ui.text()).toContain('系统合成发音');expect(ui.text()).toContain('sign up for something');}finally{ui.app.unmount()}
});

it.each([['sign up for sth.',true],['receive',false]])('WordView limits record cards only for protected entries: %s',async(word,limited)=>{
 const ui=host('web/src/views/WordView.vue',{wordId:1,initial:wordDetail(1,word)});
 try{await flush();const group=ui.all(n=>n.props.class==='cards3')[0];expect(group).toBeDefined();const text=ui.text(group);expect(text).toContain(COPY.qtypes.recognize);if(limited){expect(text).not.toContain(COPY.qtypes.spell);expect(text).not.toContain(COPY.qtypes.dictation)}else{expect(text).toContain(COPY.qtypes.spell);expect(text).toContain(COPY.qtypes.dictation)}}finally{ui.app.unmount()}
});

it.each(['success','failure'])('WordView hides recording attribution during speech fallback and on %s',async(outcome)=>{
 class Utterance {text:string;lang='';rate=1;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(text:string){this.text=text;}}
 let utterance:Utterance|undefined;
 vi.stubGlobal('SpeechSynthesisUtterance',Utterance);vi.stubGlobal('speechSynthesis',{getVoices:()=>[],speak:(u:Utterance)=>{utterance=u},cancel:vi.fn()});
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>Response.json(url.startsWith('/api/pronunciation?')?{status:'ready',accent:'us',pronunciationNote:'原真人来源'}:{status:'missing'})));
 const ui=host('web/src/views/WordView.vue',{wordId:1,initial:wordDetail()});
 try{await flush();expect(ui.text()).toContain('原真人来源');ui.all(n=>n.props['aria-label']==='听发音')[0].props.onClick();MockAudio.instances[0].emit('error');await flush();expect(utterance).toBeDefined();expect(ui.text()).not.toContain('原真人来源');expect(ui.all(n=>n.tag==='a'&&ui.text(n)===COPY.audioCredits)).toHaveLength(0);if(outcome==='success')utterance!.onend!();else utterance!.onerror!();await flush();expect(ui.text()).not.toContain('原真人来源');expect(ui.all(n=>n.tag==='a'&&ui.text(n)===COPY.audioCredits)).toHaveLength(0);if(outcome==='success')expect(ui.text()).toContain('系统合成发音');else expect(ui.text()).toContain(COPY.audioUnavailable);}finally{ui.app.unmount()}
});

it('WordView restores real attribution after recording completes',async()=>{
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>Response.json(url.startsWith('/api/pronunciation?')?{status:'ready',accent:'us',pronunciationNote:'原真人来源'}:{status:'missing'})));
 const ui=host('web/src/views/WordView.vue',{wordId:1,initial:wordDetail()});try{await flush();ui.all(n=>n.props['aria-label']==='听发音')[0].props.onClick();await flush();expect(ui.text()).toContain('原真人来源');MockAudio.instances[0].emit('ended');await flush();expect(ui.text()).toContain('原真人来源');expect(ui.text()).not.toContain('系统合成发音')}finally{ui.app.unmount()}
});
it('late speech completion after switching words cannot overwrite the new recording attribution',async()=>{
 class Utterance {text:string;lang='';rate=1;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(text:string){this.text=text;}}
 let utterance:Utterance|undefined;vi.stubGlobal('SpeechSynthesisUtterance',Utterance);vi.stubGlobal('speechSynthesis',{getVoices:()=>[],speak:(u:Utterance)=>{utterance=u},cancel:vi.fn()});
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>Response.json(url.startsWith('/api/pronunciation?')?{status:'ready',accent:'us',pronunciationNote:url.includes('accept')?'新词真人来源':'旧词真人来源'}:url==='/api/word/2'?wordDetail(2,'accept'):{status:'missing'})));
 const ui=host('web/src/views/WordView.vue',{wordId:1,initial:wordDetail()});try{await flush();ui.all(n=>n.props['aria-label']==='听发音')[0].props.onClick();MockAudio.instances[0].emit('error');await flush();const late=utterance!.onend!;expect(ui.text()).not.toContain('旧词真人来源');ui.updateProps({wordId:2});await flush();expect(ui.text()).toContain('新词真人来源');late();await flush();expect(ui.text()).toContain('新词真人来源');expect(ui.text()).not.toContain('旧词真人来源');expect(ui.text()).not.toContain('系统合成发音')}finally{ui.app.unmount()}
});
