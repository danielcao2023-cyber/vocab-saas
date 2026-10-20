export interface BundledRecording {word:string;file:string;accent:string;sourceUrl:string;author:string;license:string;licenseUrl:string;pronunciationNote?:string}
type MobileGlobals=typeof globalThis & {__VOCAB_MOBILE__?:boolean;__VOCAB_RECORDINGS__?:Record<string,BundledRecording>};
export const isMobileBuild=()=>Boolean((globalThis as MobileGlobals).__VOCAB_MOBILE__);
export function setMobileRecordings(recordings:Record<string,BundledRecording>){const state=globalThis as MobileGlobals;state.__VOCAB_MOBILE__=true;state.__VOCAB_RECORDINGS__=recordings;}
export function bundledAudio(word:string){return (globalThis as MobileGlobals).__VOCAB_RECORDINGS__?.[word]?.file;}
