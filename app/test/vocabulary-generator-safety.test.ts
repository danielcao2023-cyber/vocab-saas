import {expect,it} from 'vitest';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

it('refuses to overwrite a catalog or its sources even when inputs are unavailable',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'catalog-guard-'));
 try {
  const output=path.join(dir,'catalog.json'),sources=path.join(dir,'sources.json');
  for(const protectedFile of [output,sources]){
   fs.writeFileSync(protectedFile,'do not overwrite');
   const run=spawnSync('python3',['scripts/build-vocabulary-catalog.py','--downloads','/not-present','--textbooks','/not-present','--output',output],{encoding:'utf8'});
   expect(run.status).not.toBe(0);expect(run.stderr).toContain('refusing to overwrite');
   expect(fs.readFileSync(protectedFile,'utf8')).toBe('do not overwrite');fs.unlinkSync(protectedFile);
  }
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

it('rejects the published directory even for a new filename',()=>{
 const output=path.resolve('data/vocabulary/nonexistent-safety-check.json');
 const run=spawnSync('python3',['scripts/build-vocabulary-catalog.py','--downloads','/not-present','--textbooks','/not-present','--output',output],{encoding:'utf8'});
 expect(run.status).not.toBe(0);expect(run.stderr).toContain('refusing to overwrite published vocabulary directory');expect(fs.existsSync(output)).toBe(false);
});
