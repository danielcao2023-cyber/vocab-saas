import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {manageLesson} from '../web/src/content/lesson-samples/manage';
import type {Card,Turn,ChoiceResult} from '../web/src/types';
import {mockAudio,MockAudio} from './audio-fixtures';
import {COPY} from '../web/src/copy';
import {flush,host} from './p2-host';

const cardFor=(id:number,headword:string,mode:Card['mode']='recognize'):Card=>({id,word_id:id,headword,mode,phonetic:'/test/',meaning_zh:'v. 接受',meaning_source:'manual',meaning_flag:null,is_sample:0,state:0,reps:0,level:'三级'});
const lessonFor=(id:number,headword:string)=>({...structuredClone(manageLesson),wordId:id,headword,id:`lesson-${id}`,headline:`${headword} 的详细用法`});
const response=(value:unknown)=>new Response(JSON.stringify(value));
beforeEach(()=>{mockAudio();});
afterEach(()=>{vi.unstubAllGlobals();});

it.each(['recognize','spell','dictation','meaning_choice','listen_choice'] as const)('requests complete explanations only after revealing or answering %s',async(mode)=>{
  const card=cardFor(12,'accept',mode==='spell'||mode==='dictation'?mode:'recognize');
  const turn:Turn={card,question:mode==='meaning_choice'||mode==='listen_choice'?{id:12,qtype:mode,options:[{wordId:12,text:mode==='listen_choice'?'接受':'accept'},{wordId:13,text:mode==='listen_choice'?'收到':'receive'}]}:null};
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>{
    if(url==='/api/word/12/lesson')return response({status:'ready',lesson:lessonFor(12,'accept')});
    if(url==='/api/check')return response({correct:true,expected:'accept'});
    if(url==='/api/answer')return response({correct:true,answerWordId:12,chosenWordId:12,expected:{headword:'accept',phonetic:'/test/',meaning_zh:'v. 接受',meaning_source:'manual'},chosen:{headword:'accept',meaning_first_line:'接受'}} satisfies ChoiceResult);
    return response({status:'pending',blocks:[]});
  }));
  const ui=host('web/src/views/StudyView.vue',{prefer:'new',practice:[turn],estimate:1});
  try{
    await flush();
    expect((globalThis.fetch as any).mock.calls.filter(([url]:[string])=>url.endsWith('/lesson'))).toHaveLength(0);
    expect(ui.text()).not.toContain('accept 的详细用法');
    if(mode==='recognize')ui.key('Enter');
    else if(mode==='spell'||mode==='dictation'){
      ui.all(node=>node.tag==='input')[0].props['onUpdate:modelValue']('accept');await flush();ui.key('Enter');
    }else ui.key('1');
    await flush();
    expect((globalThis.fetch as any).mock.calls.filter(([url]:[string])=>url.endsWith('/lesson'))).toHaveLength(1);
    const panel=ui.all(node=>node.tag==='details'&&node.props.class==='answer-lesson')[0];
    expect(panel).toBeTruthy();expect(panel.props.open).toBeFalsy();
    for(const key of ['Enter',' ']){
      const stopPropagation=vi.fn(),preventDefault=vi.fn();
      panel.props.onKeydown({key,stopPropagation,preventDefault});
      expect(stopPropagation).toHaveBeenCalledOnce();
      expect(preventDefault).not.toHaveBeenCalled();
    }
    expect(ui.text()).toContain('accept 的详细用法');
    expect(ui.text()).not.toContain(COPY.explainPending);
  }finally{ui.app.unmount();}
});

it('keeps existing short examples with a complete lesson, then restores the empty state for the next pending word',async()=>{
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>{
    if(url==='/api/word/12/lesson')return response({status:'ready',lesson:lessonFor(12,'accept')});
    if(url==='/api/word/13/lesson')return response({status:'pending',lesson:null});
    if(url==='/api/word/12/content')return response({status:'ready',blocks:[{id:1,kind:'example',body:[{en:'Please accept this gift.',zh:'请收下这份礼物。',target:'accept'}],flags:[],label:'例句'}]});
    if(url==='/api/review')return response({ok:true});
    return response({status:'pending',blocks:[]});
  }));
  const ui=host('web/src/views/StudyView.vue',{prefer:'new',practice:[{card:cardFor(12,'accept'),question:null},{card:cardFor(13,'begin'),question:null}],estimate:2});
  try{
    await flush();ui.key('Enter');await flush();
    expect(ui.text()).toContain('请收下这份礼物。');
    expect(ui.text()).toContain('accept 的详细用法');
    expect(ui.text()).not.toContain(COPY.explainPending);
    ui.key('3');await flush();ui.key('Enter');await flush();
    expect(ui.text()).toContain(COPY.explainPending);
    expect(ui.text()).not.toContain('accept 的详细用法');
  }finally{ui.app.unmount();}
});

it('ignores a lesson that arrives after the learner advances to a new unanswered word',async()=>{
  let resolveOld!:(response:Response)=>void;
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>{
    if(url==='/api/word/12/lesson')return new Promise<Response>(resolve=>{resolveOld=resolve;});
    if(url==='/api/review')return response({ok:true});
    return response({status:'pending',blocks:[]});
  }));
  const ui=host('web/src/views/StudyView.vue',{prefer:'new',practice:[{card:cardFor(12,'accept'),question:null},{card:cardFor(13,'begin'),question:null}],estimate:2});
  try{
    await flush();ui.key('Enter');await flush();ui.key('3');await flush();
    expect(ui.text()).toContain('begin');
    resolveOld(response({status:'ready',lesson:lessonFor(12,'accept')}));await flush();
    expect(ui.text()).not.toContain('accept 的详细用法');
    expect(ui.all(node=>node.props.class==='answer-lesson')).toHaveLength(0);
    expect(globalThis.fetch).not.toHaveBeenCalledWith('/api/word/13/lesson',undefined);
  }finally{ui.app.unmount();}
});

it.each(['pending','failed'] as const)('keeps the short explanation and the learner controls when the complete lesson is %s',async(state)=>{
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>{
    if(url.endsWith('/lesson')){
      if(state==='failed')throw new TypeError('offline');
      return response({status:'pending',lesson:null});
    }
    return response({status:'ready',blocks:[{id:1,kind:'example',body:[{en:'Please accept this gift.',zh:'请收下这份礼物。',target:'accept'}],flags:[],label:'例句'}]});
  }));
  const ui=host('web/src/views/StudyView.vue',{prefer:'new',practice:[{card:cardFor(12,'accept'),question:null}],estimate:1});
  try{
    await flush();ui.key('Enter');await flush();
    expect(ui.text()).toContain('请收下这份礼物。');
    expect(ui.all(node=>node.props.class==='answer-lesson')).toHaveLength(0);
    expect(ui.all(node=>node.tag==='button'&&node.props.class?.includes('rate'))).toHaveLength(4);
  }finally{ui.app.unmount();}
});

it('plays the current word from the sound-spelling tab inside a revealed answer lesson',async()=>{
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>url==='/api/word/693/lesson'
  ?response({status:'ready',lesson:lessonFor(693,'important')})
  :response({status:'pending',blocks:[]})));
 const ui=host('web/src/views/StudyView.vue',{prefer:'new',practice:[{card:cardFor(693,'important'),question:null}],estimate:1});
 try{
  await flush();ui.key('Enter');await flush();
  ui.all(n=>n.tag==='button'&&ui.text(n).includes('听整词录音'))[0].props.onClick();await flush();
  expect(MockAudio.instances).toHaveLength(1);
  expect(MockAudio.instances[0].src).toContain('word=important');
  expect(MockAudio.instances[0].play).toHaveBeenCalledOnce();
 }finally{ui.app.unmount();}
});

 it('plays the selected mixed form inside a revealed answer lesson instead of the first word',async()=>{
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url==='/api/word/19/lesson'
   ?response({status:'ready',lesson:lessonFor(19,'actor / actress')})
   :response({status:'pending',blocks:[]})));
  const ui=host('web/src/views/StudyView.vue',{prefer:'new',practice:[{card:cardFor(19,'actor / actress'),question:null}],estimate:1});
  try{await flush();ui.key('Enter');await flush();
   ui.all(n=>n.tag==='button'&&n.props['aria-label']==='拼写对照 actress')[0].props.onClick();await flush();
   ui.all(n=>n.tag==='button'&&ui.text(n).includes('听整词录音'))[0].props.onClick();await flush();
   expect(MockAudio.instances[0].src).toBe('/api/pronunciation/audio?word=actress');
   MockAudio.instances[0].emit('error');await flush();
   ui.all(n=>n.tag==='button'&&ui.text(n)===COPY.audioRetry)[0].props.onClick();await flush();
   expect(MockAudio.instances[1].src).toBe('/api/pronunciation/audio?word=actress');
  }finally{ui.app.unmount();}
 });
