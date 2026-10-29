/** Explicit names avoid turning user-controlled headwords into paths. */
export const keyedLessons: Readonly<Record<string,string>> = Object.freeze({'the Amish':'the-amish.json'});
export function keyedLessonName(headword:string):string|undefined {
 return Object.hasOwn(keyedLessons,headword) ? keyedLessons[headword] : undefined;
}
