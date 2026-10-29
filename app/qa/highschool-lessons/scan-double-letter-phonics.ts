// Run from the repository root: npx tsx app/qa/highschool-lessons/scan-double-letter-phonics.ts
import {soundSpellingLessons} from '../../web/src/content/sound-spelling';

for (const lesson of soundSpellingLessons) {
 const pairs=lesson.chunks.flatMap((chunk, index)=>chunk.pairs.map(pair=>({
  ...pair,chunk:chunk.letters,stress:chunk.stress,chunkIndex:index,
 })));
 for(let i=0;i<pairs.length-1;i++){
  const a=pairs[i],b=pairs[i+1];
  if(a.letters.length!==1||a.letters.toLowerCase()!==b.letters.toLowerCase()||Boolean(a.sound)===Boolean(b.sound)) continue;
  console.log(JSON.stringify({headword:lesson.headword,ipa:lesson.ipa,letters:a.letters+b.letters,
   sound:a.sound||b.sound,firstChunk:a.chunk,firstStress:a.stress,secondChunk:b.chunk,
   secondStress:b.stress,sameChunk:a.chunkIndex===b.chunkIndex}));
 }
}
