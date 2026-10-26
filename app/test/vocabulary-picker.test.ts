import {afterEach,expect,it,vi} from 'vitest';
import {host,flush} from './p2-host';
const books=[{id:'high',title:'高中必修第一册',category:'high',edition:'2019',sourceUrl:'',wordCount:20,units:[{id:'u1',title:'Unit 1',position:0,wordCount:8}]},{id:'cet4',title:'四级',category:'exam',edition:'考试',sourceUrl:'',wordCount:30,units:[]}];
afterEach(()=>vi.unstubAllGlobals());
it('responds to parent scope updates and resets the unit on book changes',async()=>{
 const update=vi.fn(),ui=host('web/src/components/VocabularyPicker.vue',{books,modelValue:{bookId:'high',unitId:'u1'},'onUpdate:modelValue':update});
 try{expect(ui.text()).toContain('2019 · 8词');const book=()=>ui.all(n=>n.props['aria-label']==='学习词书')[0];book().props.onChange({target:{value:'cet4'}});expect(update).toHaveBeenCalledWith({bookId:'cet4',unitId:null});ui.updateProps({modelValue:{bookId:'cet4',unitId:null}});await flush();expect(book().props.value).toBe('cet4');expect(ui.all(n=>n.props['aria-label']==='学习单元')).toHaveLength(0);expect(ui.text()).toContain('考试 · 30词');}finally{ui.app.unmount();}
});
it('converts the all-unit option to null and provides distinct accessible IDs',()=>{
 const update=vi.fn(),a=host('web/src/components/VocabularyPicker.vue',{books,modelValue:{bookId:'high',unitId:'u1'},'onUpdate:modelValue':update});
 try{const unit=a.all(n=>n.props['aria-label']==='学习单元')[0];unit.props['onUpdate:modelValue']('');expect(update).toHaveBeenCalledWith({bookId:'high',unitId:null});const ids=a.all(n=>n.tag==='select').map(n=>n.props.id);expect(new Set(ids).size).toBe(2);for(const id of ids)expect(a.all(n=>n.tag==='label'&&n.props.for===id)).toHaveLength(1);}finally{a.app.unmount();}
});
