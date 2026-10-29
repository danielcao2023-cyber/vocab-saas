import {expect,it,vi} from 'vitest';
import {host,flush} from './p2-host';
it('shows the oven meaning and switches from nine to thirteen letter slots',async()=>{
 const update=vi.fn();const ui=host('web/src/components/FocusStudyCard.vue',{card:{issueId:'i',wordId:1,mode:'spell',patterns:['_________','_________ ____'],meaning:'n. 微波；微波炉；v. 用微波炉加热',meaning_source:'词库导入',options:[],assisted:false},answer:'',feedback:null,busy:false,audioFailed:null,'onUpdate:answer':update});
 try{await flush();expect(ui.text(ui.root)).toContain('微波炉');expect(ui.all(n=>n.tag==='input')).toHaveLength(9);const longer=ui.all(n=>n.tag==='button'&&ui.text(n)==='13 个字母')[0];expect(longer).toBeDefined();longer.props.onClick();await flush();expect(ui.all(n=>n.tag==='input')).toHaveLength(13);expect(update).toHaveBeenCalledWith('');}finally{ui.app.unmount()}
});
