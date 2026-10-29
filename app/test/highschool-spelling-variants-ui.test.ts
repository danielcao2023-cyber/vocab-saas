import {expect,it,vi} from 'vitest';
import {host,flush} from './p2-host';
it('lets a learner choose the five-letter chili spelling and enter all five letters',async()=>{
 const onUpdate=vi.fn();const ui=host('web/src/components/FocusStudyCard.vue',{card:{issueId:'i',wordId:1,mode:'dictation',patterns:['______','_____'],audioWord:'chilli',options:[],assisted:false},answer:'',feedback:null,busy:false,audioFailed:null,'onUpdate:answer':onUpdate});
 try{await flush();expect(ui.all(n=>n.tag==='input')).toHaveLength(6);const five=ui.all(n=>n.tag==='button'&&ui.text(n)==='5 个字母')[0];expect(five).toBeDefined();five.props.onClick();await flush();expect(ui.all(n=>n.tag==='input')).toHaveLength(5);expect(onUpdate).toHaveBeenCalledWith('');}finally{ui.app.unmount()}
});
it('lets a learner select the eight-letter mustache alternative to moustache',async()=>{
 const ui=host('web/src/components/FocusStudyCard.vue',{card:{issueId:'i',wordId:1,mode:'spell',patterns:['_________','________'],meaning:'小胡子',options:[],assisted:false},answer:'',feedback:null,busy:false,audioFailed:null});
 try{await flush();expect(ui.all(n=>n.tag==='input')).toHaveLength(9);const eight=ui.all(n=>n.tag==='button'&&ui.text(n)==='8 个字母')[0];expect(eight).toBeDefined();eight.props.onClick();await flush();expect(ui.all(n=>n.tag==='input')).toHaveLength(8)}finally{ui.app.unmount()}
});
