import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {speak,stopAudio} from '../web/src/audio';
import {mockAudio,MockAudio} from './audio-fixtures';
beforeEach(mockAudio);afterEach(()=>{stopAudio();vi.unstubAllGlobals()});
it.each([['on behalf','on behalf'],["seek one's fortune","seek one's fortune"],['commit oneself to','commit oneself to'],['the OB-GYN department','the OB-GYN department']])('records actual text passed to speech synthesis for %s',async(word,expected)=>{
 class Utterance {text:string;lang='';rate=1;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(text:string){this.text=text;}}let spoken:Utterance|undefined;
 vi.stubGlobal('SpeechSynthesisUtterance',Utterance);vi.stubGlobal('speechSynthesis',{getVoices:()=>[],speak:(u:Utterance)=>{spoken=u},cancel:vi.fn()});const pending=speak(word);MockAudio.instances[0].emit('error');expect(spoken?.text).toBe(expected);spoken!.onend!();await expect(pending).resolves.toEqual({status:'success',source:'system'});
});
