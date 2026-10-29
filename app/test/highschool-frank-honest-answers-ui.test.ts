import {expect,it,vi} from 'vitest';
import {host,flush} from './p2-host';
it('allows choosing the 9 or 10 letter answer while preserving the phrase spacing',async()=>{
 const update=vi.fn();const ui=host('web/src/components/FocusStudyCard.vue',{card:{issueId:'i',wordId:1,mode:'spell',patterns:['__ __ _____','__ __ ______'],meaning:'phr. 坦白说；说实话',meaning_source:'词库导入',options:[],assisted:false},answer:'',feedback:null,busy:false,audioFailed:null,'onUpdate:answer':update});
 try{await flush();expect(ui.text(ui.root)).toContain('说实话');expect(ui.all(n=>n.tag==='input')).toHaveLength(9);const longer=ui.all(n=>n.tag==='button'&&ui.text(n)==='10 个字母')[0];expect(longer).toBeDefined();longer.props.onClick();await flush();expect(ui.all(n=>n.tag==='input')).toHaveLength(10);expect(update).toHaveBeenCalledWith('');}finally{ui.app.unmount()}
});
