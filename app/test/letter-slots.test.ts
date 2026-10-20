import {afterEach,expect,it,vi} from 'vitest';
import {host,flush} from './p2-host';
afterEach(()=>vi.unstubAllGlobals());
it('distributes a pasted word and retains fixed punctuation',async()=>{
 const update=vi.fn(),ui=host('web/src/components/LetterSlots.vue',{modelValue:'',pattern:"___'_",'onUpdate:modelValue':update});
 try{const fields=ui.all(n=>n.tag==='input');expect(fields).toHaveLength(4);
 fields[0].props.onPaste({preventDefault(){},clipboardData:{getData:()=>"DON’T"}});await flush();
 expect(update).toHaveBeenLastCalledWith("don't");expect(ui.text()).toContain("'");
 ui.updateProps({modelValue:'',pattern:'_____'});await flush();expect(ui.all(n=>n.tag==='input').every(n=>n.value==='')).toBe(true);
 }finally{ui.app.unmount();}
});
it('supports keyboard submission and disables all editing while saving',async()=>{
 const submit=vi.fn(),update=vi.fn(),ui=host('web/src/components/LetterSlots.vue',{modelValue:'above',pattern:'_____',onSubmit:submit,'onUpdate:modelValue':update});
 try{let fields=ui.all(n=>n.tag==='input');fields[4].props.onKeydown({key:'Enter',preventDefault(){}});expect(submit).toHaveBeenCalledOnce();
 ui.updateProps({disabled:true});await flush();fields=ui.all(n=>n.tag==='input');expect(fields.every(n=>n.props.disabled)).toBe(true);
 fields[0].props.onKeydown({key:'Enter',preventDefault(){}});expect(submit).toHaveBeenCalledOnce();
 }finally{ui.app.unmount();}
});
it('keeps later letters in place when correcting a middle slot through v-model',async()=>{
 const ui=host('web/src/components/LetterSlots.vue',{modelValue:'above',pattern:'_____','onUpdate:modelValue':(value:string)=>ui.updateProps({modelValue:value})});
 try{let fields=ui.all(n=>n.tag==='input');fields[2].value='';fields[2].props.onInput({target:fields[2]});await flush();
 expect(ui.all(n=>n.tag==='input').map(n=>n.value)).toEqual(['a','b','','v','e']);
 fields=ui.all(n=>n.tag==='input');fields[2].value='o';fields[2].props.onInput({target:fields[2]});await flush();expect(ui.all(n=>n.tag==='input').map(n=>n.value)).toEqual(['a','b','o','v','e']);
 }finally{ui.app.unmount();}
});
