import {expect,it,vi} from 'vitest';
import {host,flush} from './p2-host';
it('shows the two complete phrase lengths for the displayed causal sense',async()=>{
 const update=vi.fn();const ui=host('web/src/components/FocusStudyCard.vue',{card:{issueId:'i',wordId:1,mode:'spell',patterns:['____ __','______ __','_____ _____'],meaning:'短语 导致；造成；通向',meaning_source:'词库导入',options:[],assisted:false},answer:'',feedback:null,busy:false,audioFailed:null,'onUpdate:answer':update});
 try{await flush();expect(ui.text(ui.root)).toContain('导致');expect(ui.all(n=>n.tag==='input')).toHaveLength(6);const longer=ui.all(n=>n.tag==='button'&&ui.text(n)==='8 个字母')[0];expect(longer).toBeDefined();longer.props.onClick();await flush();expect(ui.all(n=>n.tag==='input')).toHaveLength(8);const longest=ui.all(n=>n.tag==='button'&&ui.text(n)==='10 个字母')[0];expect(longest).toBeDefined();longest.props.onClick();await flush();expect(ui.all(n=>n.tag==='input')).toHaveLength(10);expect(update).toHaveBeenCalledWith('');}finally{ui.app.unmount()}
});
