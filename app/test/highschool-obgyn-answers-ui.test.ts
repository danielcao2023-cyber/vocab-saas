import {expect,it,vi} from 'vitest';
import {host,flush} from './p2-host';
it('switches between full textbook department names without losing punctuation',async()=>{
 const update=vi.fn();const ui=host('web/src/components/FocusStudyCard.vue',{card:{issueId:'i',wordId:1,mode:'spell',patterns:['___ __-___ __________','__________ __ __________ ___ __________'],meaning:'n. 妇产科',meaning_source:'词库导入',options:[],assisted:false},answer:'',feedback:null,busy:false,audioFailed:null,'onUpdate:answer':update});
 try{await flush();expect(ui.text(ui.root)).toContain('妇产科');expect(ui.all(n=>n.tag==='input')).toHaveLength(18);const longer=ui.all(n=>n.tag==='button'&&ui.text(n)==='35 个字母')[0];expect(longer).toBeDefined();longer.props.onClick();await flush();expect(ui.all(n=>n.tag==='input')).toHaveLength(35);expect(update).toHaveBeenCalledWith('');}finally{ui.app.unmount()}
});
