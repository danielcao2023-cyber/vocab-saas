import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {manageLesson} from '../web/src/content/lesson-samples/manage';
import type {WordLesson} from '../shared/lesson';
import type {WordDetail} from '../web/src/types';
import {COPY} from '../web/src/copy';
import {mockAudio,MockAudio} from './audio-fixtures';
import {flush,host} from './p2-host';

const lessonFor=(id:number,headword:string):WordLesson=>({...structuredClone(manageLesson),wordId:id,headword,id:`lesson-${id}`,headline:`${headword} 的完整讲解`});
const detailFor=(id:number,headword:string):WordDetail=>({
  word:{id,headword,pos:'v.',phonetic:'/test/',meaning_zh:'v. 原有释义',meaning_source:'manual',meaning_flag:null,source:'kb2022',level:'三级'},
  status:'新词',statusDetail:{recognize:null,spell:null,dictation:null},wrong:null,
  content:{status:'pending',blocks:[]},
});
const response=(value:unknown)=>new Response(JSON.stringify(value));
beforeEach(()=>{mockAudio();});
afterEach(()=>{vi.unstubAllGlobals();});

it('loads a lesson on demand without blocking the word or audio, then replaces old content',async()=>{
  let resolveLesson!:(r:Response)=>void;
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url==='/api/word/12/lesson'
    ?new Promise<Response>(resolve=>{resolveLesson=resolve;})
    :response({status:'missing'})));
  const ui=host('web/src/views/WordView.vue',{wordId:12,initial:detailFor(12,'accept')});
  try{
    expect(ui.text()).toContain('原有释义');
    ui.all(node=>node.props['aria-label']==='听发音')[0].props.onClick();
    expect(MockAudio.instances[0].src).toContain('word=accept');
    resolveLesson(response({status:'ready',lesson:lessonFor(12,'accept')}));await flush();
    expect(ui.text()).toContain('accept 的完整讲解');
    expect(ui.text()).not.toContain('原有释义');
    expect(ui.all(node=>node.tag==='aside')).toHaveLength(0);
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/word/12/lesson',undefined);
  }finally{ui.app.unmount();}
});

it('ignores a late lesson response after switching words',async()=>{
  let resolveOld!:(r:Response)=>void;
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>{
    if(url==='/api/word/12/lesson')return new Promise<Response>(resolve=>{resolveOld=resolve;});
    if(url==='/api/word/13/lesson')return response({status:'ready',lesson:lessonFor(13,'begin')});
    if(url==='/api/word/13')return response(detailFor(13,'begin'));
    return response({status:'missing'});
  }));
  const ui=host('web/src/views/WordView.vue',{wordId:12,initial:detailFor(12,'accept')});
  try{
    ui.updateProps({wordId:13});await flush();
    expect(ui.text()).toContain('begin 的完整讲解');
    resolveOld(response({status:'ready',lesson:lessonFor(12,'accept')}));await flush();
    expect(ui.text()).not.toContain('accept 的完整讲解');
    expect(ui.text()).toContain('begin 的完整讲解');
  }finally{ui.app.unmount();}
});

it('keeps pending content usable and preserves the real wrong-book action in learning records',async()=>{
  const detail=detailFor(12,'accept');
  vi.stubGlobal('fetch',vi.fn(async(url:string,options?:RequestInit)=>{
    if(url==='/api/word/12/lesson')return response({status:'pending',lesson:null});
    if(url==='/api/wrong/12'){
      expect(JSON.parse(options!.body as string)).toEqual({inBook:true});
      detail.wrong={inBook:true,wrong_count:0,correct_days:[]};
      return response({ok:true});
    }
    if(url==='/api/word/12')return response(detail);
    return response({status:'missing'});
  }));
  const ui=host('web/src/views/WordView.vue',{wordId:12,initial:detail});
  try{
    await flush();expect(ui.text()).toContain('原有释义');
    expect(ui.text()).toContain('学习记录');
    ui.all(node=>node.tag==='button'&&ui.text(node)===COPY.addWrong)[0].props.onClick();await flush();
    expect(ui.all(node=>node.tag==='button'&&ui.text(node)===COPY.removeWrong)).toHaveLength(1);
    expect(ui.text()).toContain(COPY.inWrong);
    expect(ui.text()).toContain('这个词还没开始认词，暂时不会进入“练错词”。');
    expect(ui.text()).not.toContain('加入后会出现在');
  }finally{ui.app.unmount();}
});

it('allows a failed lesson load to retry without reloading or hiding the word',async()=>{
  let calls=0;
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>{
    if(url==='/api/word/12/lesson'){
      if(++calls===1)throw new TypeError('offline');
      return response({status:'ready',lesson:lessonFor(12,'accept')});
    }
    return response({status:'missing'});
  }));
  const ui=host('web/src/views/WordView.vue',{wordId:12,initial:detailFor(12,'accept')});
  try{
    await flush();expect(ui.text()).toContain('原有释义');
    ui.all(node=>node.tag==='button'&&ui.text(node)==='重试讲解')[0].props.onClick();await flush();
    expect(ui.text()).toContain('accept 的完整讲解');
    expect(ui.text()).not.toContain('完整讲解暂时未能载入');
  }finally{ui.app.unmount();}
});

it('does not render a lesson bound to a different headword',async()=>{
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>response(url.endsWith('/lesson')
    ?{status:'ready',lesson:lessonFor(12,'different')}
    :{status:'missing'})));
  const ui=host('web/src/views/WordView.vue',{wordId:12,initial:detailFor(12,'accept')});
  try{await flush();expect(ui.text()).toContain('原有释义');expect(ui.text()).not.toContain('different 的完整讲解');}
  finally{ui.app.unmount();}
});

it('shows why relations or roots do not apply, and separates checked sources from further reading',async()=>{
  const lesson=lessonFor(12,'accept');
  lesson.senses[0].relatedExpressions={similar:[],contrasting:[],similarNote:'这个用法没有能直接替换的近义词。',contrastingNote:'这里没有自然的一对一反义词。'};
  lesson.etymology.stages=[];lesson.etymology.summary='作为一个整体记忆，不作词根拆分。';
  lesson.wordFamily=[];lesson.wordFamilyNote='此阶段无需扩展同族词。';
  lesson.sources=[{id:'reference',title:'延伸词典',url:'https://example.com/dictionary',supports:['可继续查阅词条'],verification:'recommended'},...lesson.sources];
  const ui=host('web/src/components/SenseLesson.vue',{lesson});
  try{
    expect(ui.text()).toContain('这里没有自然的一对一反义词。');
    ui.all(node=>node.props.role==='tab'&&ui.text(node)==='词根与词族')[0].props.onClick();await flush();
    expect(ui.text()).toContain('作为一个整体记忆，不作词根拆分。');
    expect(ui.text()).toContain('此阶段无需扩展同族词。');
    expect(ui.text()).toContain('已核对来源');expect(ui.text()).toContain('延伸阅读');
  }finally{ui.app.unmount();}
});

it.each([
  {ipa:'/new/',legacy:'/old/',ready:true,expected:'/new/'},
  {ipa:'',legacy:'/old/',ready:true,expected:'/old/'},
  {ipa:'',legacy:null,ready:true,expected:null},
  {ipa:'/new/',legacy:'/old/',ready:false,expected:'/old/'},
])('uses available lesson or original phonetics and hides an absent label ($expected)',async({ipa,legacy,ready,expected})=>{
  const lesson=lessonFor(12,'accept');lesson.pronunciation.ipa=ipa;
  const detail=detailFor(12,'accept');detail.word.phonetic=legacy;
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>response(url.endsWith('/lesson')
    ?ready?{status:'ready',lesson}:{status:'pending',lesson:null}
    :{status:'missing'})));
  const ui=host('web/src/views/WordView.vue',{wordId:12,initial:detail});
  try{
    await flush();const labels=ui.all(node=>node.props.class==='phon');
    expect(labels.map(node=>ui.text(node))).toEqual(expected?[expected]:[]);
    expect(ui.text()).not.toContain('暂无音标');
  }finally{ui.app.unmount();}
});

it('changes lesson panels without scrolling or adding history entries',async()=>{
  const lesson=lessonFor(12,'accept');
  const ui=host('web/src/components/SenseLesson.vue',{lesson});
  const target={scrollIntoView:vi.fn(),focus:vi.fn()};
  const lookup=vi.fn(()=>target);Object.assign(document,{getElementById:lookup});
  const pushState=vi.fn();vi.stubGlobal('history',{pushState});
  try{
    ui.all(node=>node.props.role==='tab'&&ui.text(node)==='助记办法')[0].props.onClick();await flush();
    expect(ui.text(ui.all(node=>node.props.role==='tabpanel')[0])).toContain(lesson.memoryAid.story);
    expect(lookup).not.toHaveBeenCalled();
    expect(target.scrollIntoView).not.toHaveBeenCalled();
    expect(pushState).not.toHaveBeenCalled();
    expect(ui.all(node=>node.tag==='a'&&String(node.props.href).startsWith('#'))).toHaveLength(0);
  }finally{ui.app.unmount();}
});

it.each([
  {accent:'us',status:'ready',missing:false,expected:'/ˈæftər/',note:'美式录音'},
  {accent:'uk',status:'ready',missing:false,expected:'/ˈɑːftə/',note:'英式录音'},
  {accent:'other',status:'ready',missing:false,expected:'/ˈɑːftə(r)/',note:null},
  {accent:'us',status:'missing',missing:false,expected:'/ˈɑːftə(r)/',note:null},
  {accent:'us',status:'ready',missing:true,expected:'/ˈɑːftə(r)/',note:'美式录音'},
])('shows the IPA corresponding to a confirmed $accent recording, with general fallback',async({accent,status,missing,expected,note})=>{
  const lesson=lessonFor(31,'after');
  Object.assign(lesson.pronunciation,{ipa:'/ˈɑːftə(r)/',uk:'/ˈɑːftə/',us:missing?'':'/ˈæftər/'});
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>response(url.endsWith('/lesson')?{status:'ready',lesson}:{status,accent})));
  const ui=host('web/src/views/WordView.vue',{wordId:31,initial:detailFor(31,'after')});
  try{
    await flush();expect(ui.all(node=>node.props.class==='phon').map(node=>ui.text(node))).toEqual([expected]);
    expect(ui.all(node=>node.props['aria-label']==='发音说明').map(node=>ui.text(node))).toEqual(note?[note]:[]);
  }finally{ui.app.unmount();}
});

it('ignores recording metadata that arrives after switching words',async()=>{
  let resolveOld!:(r:Response)=>void;
  const after=lessonFor(31,'after');Object.assign(after.pronunciation,{ipa:'/general/',uk:'/uk/',us:'/us/'});
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>{
    if(url==='/api/pronunciation?word=accept')return new Promise<Response>(resolve=>{resolveOld=resolve;});
    if(url==='/api/pronunciation?word=after')return response({status:'ready',accent:'uk'});
    if(url==='/api/word/31/lesson')return response({status:'ready',lesson:after});
    if(url==='/api/word/31')return response(detailFor(31,'after'));
    return response({status:'pending',lesson:null});
  }));
  const ui=host('web/src/views/WordView.vue',{wordId:12,initial:detailFor(12,'accept')});
  try{
    ui.updateProps({wordId:31});await flush();
    resolveOld(response({status:'ready',accent:'us'}));await flush();
    expect(ui.all(node=>node.props.class==='phon').map(node=>ui.text(node))).toEqual(['/uk/']);
    expect(ui.text()).toContain('英式录音');expect(ui.text()).not.toContain('美式录音');
  }finally{ui.app.unmount();}
});
