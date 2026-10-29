import {expect,it,vi} from 'vitest';
import {host,flush} from './p2-host';
it('switches between the single word and full phrase lengths',async()=>{
 const update=vi.fn();const ui=host('web/src/components/FocusStudyCard.vue',{card:{issueId:'i',wordId:1,mode:'spell',patterns:['________','__ _ ______ __ ____'],meaning:'adv. 实际上；事实上',meaning_source:'词库导入',options:[],assisted:false},answer:'',feedback:null,busy:false,audioFailed:null,'onUpdate:answer':update});
 try{await flush();expect(ui.text(ui.root)).toContain('事实上');expect(ui.all(n=>n.tag==='input')).toHaveLength(8);const longer=ui.all(n=>n.tag==='button'&&ui.text(n)==='15 个字母')[0];expect(longer).toBeDefined();longer.props.onClick();await flush();expect(ui.all(n=>n.tag==='input')).toHaveLength(15);expect(update).toHaveBeenCalledWith('');}finally{ui.app.unmount()}
});
