/** Explicit names avoid turning user-controlled headwords into paths. */
export const keyedLessons: Readonly<Record<string,string>> = Object.freeze({'the Amish':'the-amish.json','nanobot':'nanobot.json','Sami':'sami.json','Rapa River':'rapa-river.json','take up a position':'take-up-a-position.json','Alexander Fleming':'alexander-fleming.json','Elon Musk':'elon-musk.json','commit oneself to':'commit-oneself-to.json','Jean Anthelme Brillat-Savarin':'jean-anthelme-brillat-savarin.json','St Andrews':'st-andrews.json','Butchart Gardens':'butchart-gardens.json','Jean-Philippe':'jean-philippe.json','vital sign':'vital-sign.json','geothermal park':'geothermal-park.json','keep balance':'keep-balance-legacy.json','keep a balance':'keep-a-balance.json'});
export function keyedLessonName(headword:string):string|undefined {
 return Object.hasOwn(keyedLessons,headword) ? keyedLessons[headword] : undefined;
}
