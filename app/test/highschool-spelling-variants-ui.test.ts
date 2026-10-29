import {expect,it,vi} from 'vitest';
import {host,flush} from './p2-host';
it('lets a learner choose the five-letter chili spelling and enter all five letters',async()=>{
 const onUpdate=vi.fn();const ui=host('web/src/components/FocusStudyCard.vue',{card:{issueId:'i',wordId:1,mode:'dictation',patterns:['______','_____'],audioWord:'chilli',options:[],assisted:false},answer:'',feedback:null,busy:false,audioFailed:null,'onUpdate:answer':onUpdate});
 try{await flush();expect(ui.all(n=>n.tag==='input')).toHaveLength(6);const five=ui.all(n=>n.tag==='button'&&ui.text(n)==='5 个字母')[0];expect(five).toBeDefined();five.props.onClick();await flush();expect(ui.all(n=>n.tag==='input')).toHaveLength(5);expect(onUpdate).toHaveBeenCalledWith('');}finally{ui.app.unmount()}
});
