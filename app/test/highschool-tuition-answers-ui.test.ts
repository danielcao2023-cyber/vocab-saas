import {expect,it,vi} from 'vitest';
import {host,flush} from './p2-host';
it('shows the tuition meaning and switches from seven to eleven letter slots',async()=>{
 const update=vi.fn();const ui=host('web/src/components/FocusStudyCard.vue',{card:{issueId:'i',wordId:1,mode:'spell',patterns:['_______','_______ ____'],meaning:'n. 学费；讲授',meaning_source:'词库导入',options:[],assisted:false},answer:'',feedback:null,busy:false,audioFailed:null,'onUpdate:answer':update});
 try{await flush();expect(ui.text(ui.root)).toContain('学费');expect(ui.all(n=>n.tag==='input')).toHaveLength(7);const longer=ui.all(n=>n.tag==='button'&&ui.text(n)==='11 个字母')[0];expect(longer).toBeDefined();longer.props.onClick();await flush();expect(ui.all(n=>n.tag==='input')).toHaveLength(11);expect(update).toHaveBeenCalledWith('');}finally{ui.app.unmount()}
});
