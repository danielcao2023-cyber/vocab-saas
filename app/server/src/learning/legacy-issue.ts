/** Old in-flight issue saved while correcting this one textbook headword. */
export function legacyIssueHeadword(issue:{mode:string;options_json:string},current:string):string|null {
 if(current!=='keep a balance'||issue.mode==='recognize')return null;
 try{const data=JSON.parse(issue.options_json);return Array.isArray(data)&&data.length===1&&data[0]?.legacyHeadword==='keep balance'?'keep balance':null;}catch{return null;}
}
