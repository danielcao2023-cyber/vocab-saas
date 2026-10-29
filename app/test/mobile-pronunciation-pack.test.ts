import {expect,it} from 'vitest';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {packPronunciations} from '../scripts/mobile-pronunciation-assets';

it('packs valid variants and their credits even without a valid default recording',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vocab-audio-'));const src=path.join(dir,'src'),dest=path.join(dir,'out');fs.mkdirSync(src);fs.mkdirSync(dest);
 try{
  const bytes=Buffer.from('noun audio'),file='noun.mp3';fs.writeFileSync(path.join(src,file),bytes);
  const noun={word:'estimate',file,sha256:createHash('sha256').update(bytes).digest('hex'),accent:'us',author:'Speaker',license:'CC BY',sourceUrl:'https://example.com/source',licenseUrl:'https://example.com/license',ipa:'/a/'};
  const output=packPronunciations({version:1,entries:{estimate:{word:'estimate',variants:{noun,verb:{...noun,file:'missing.mp3'}}}}},src,dest);
  expect(output.recordings.estimate.file).toBeUndefined();
  expect(output.recordings.estimate.variants.noun.file).toBe('/offline/recordings/noun.mp3');
  expect(output.recordings.estimate.variants.verb).toBeUndefined();
  expect(fs.readFileSync(path.join(dest,file))).toEqual(bytes);
  expect(output.credits).toContain('<tr id="estimate">');expect(output.credits).toContain('Speaker');expect(output.credits).toContain('https://example.com/source');expect(output.credits).toContain('名词');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

it('does not ship variants with invalid provenance and refuses corrupt audio',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vocab-audio-'));const src=path.join(dir,'src'),dest=path.join(dir,'out');fs.mkdirSync(src);fs.mkdirSync(dest);
 try{
  fs.writeFileSync(path.join(src,'noun.mp3'),'audio');
  const base={word:'estimate',file:'noun.mp3',sha256:'0'.repeat(64),accent:'us',author:'Speaker',license:'CC BY',sourceUrl:'https://example.com/source',licenseUrl:'https://example.com/license'};
  expect(()=>packPronunciations({version:1,entries:{estimate:{word:'estimate',variants:{noun:base}}}},src,dest)).toThrow('integrity mismatch');
  const invalid={...base,sourceUrl:'https://user:pass@example.com/'};
  expect(packPronunciations({version:1,entries:{estimate:{word:'estimate',variants:{noun:invalid}}}},src,dest).recordings).toEqual({});
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

it('uses one escaped word anchor for a default and multiple variants',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vocab-audio-'));const src=path.join(dir,'src'),dest=path.join(dir,'out');fs.mkdirSync(src);fs.mkdirSync(dest);
 try{
  const bytes=Buffer.from('audio');fs.writeFileSync(path.join(src,'a.mp3'),bytes);
  const word='word&\"<x>';const r={word,file:'a.mp3',sha256:createHash('sha256').update(bytes).digest('hex'),accent:'us',author:'A',license:'CC BY',sourceUrl:'https://example.com/source',licenseUrl:'https://example.com/license'};
  const {credits}=packPronunciations({version:1,entries:{[word]:{...r,variants:{noun:r,verb:r}}}},src,dest);
  expect(credits.match(/ id=/g)).toHaveLength(1);
  expect(credits).toContain('id=\"word&amp;&quot;&lt;x&gt;\"');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
