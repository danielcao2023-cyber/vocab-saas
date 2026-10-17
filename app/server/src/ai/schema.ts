const str={type:'string'};const list=(items:object)=>({type:'array',items});const object=(properties:Record<string,object>,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
const pair=object({en:str,zh:str});const ref=object({word:str,note_zh:str});const root=object({word:str,zh:str});
export const contentItem=object({word:str,examples:list(object({en:str,zh:str,target:str})),collocations:list(pair),distinctions:list(object({words:list(str),explain_zh:str,example:{anyOf:[pair,{type:'null'}]}})),synonyms:list(ref),antonyms:list(ref),pronunciation:{anyOf:[object({syllables:list(str),stress:{type:'integer'},points_zh:list(str),common_errors_zh:list(str)}),{type:'null'}]},etymology:{anyOf:[object({confidence:{enum:['high','medium','low']},chain:str,parts:list(object({form:str,meaning_zh:str,origin:str})),explain_zh:str,same_root:list(root)}),{type:'null'}]},association:{anyOf:[object({text_zh:str}),{type:'null'}]},related_words:list(object({word:str,zh:str,relation:{enum:['derivative','compound','same_root']}}))});
export const contentSchema=object({items:list(contentItem)});
/** The first complete teaching layer: examples and useful phrases, without speculative extras. */
export const coreContentSchema=object({items:list(object({
  word:str,
  examples:{...list(object({en:str,zh:str,target:str})),minItems:2,maxItems:2},
  collocations:{...list(pair),minItems:2,maxItems:3},
  distinctions:{...list(object({words:list(str),explain_zh:str,example:{anyOf:[pair,{type:'null'}]}})),maxItems:0},
  synonyms:{...list(ref),maxItems:0},antonyms:{...list(ref),maxItems:0},
  pronunciation:{type:'null'},etymology:{type:'null'},association:{type:'null'},
  related_words:{...list(object({word:str,zh:str,relation:{enum:['derivative','compound','same_root']}})),maxItems:0},
}))});
export const zkSchema=object({items:list(object({word:str,score:{type:'integer',minimum:1,maximum:5},basis_zh:str}))});
