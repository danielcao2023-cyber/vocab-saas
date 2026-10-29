import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('pairs sow, relay and complex default audio metadata with sourced pronunciations', () => {
 const entries=JSON.parse(readFileSync('data/pronunciation/manifest.json','utf8')).entries;
 expect(entries.sow).toMatchObject({ipa:'/saʊ/'});
 expect(entries.sow.variants.noun).toMatchObject({ipa:'/saʊ/',label:'母猪'});
 expect(entries.sow.variants.verb).toMatchObject({ipa:'/soʊ/',label:'播种'});
 expect(entries.relay).toMatchObject({ipa:'/ˈriːleɪ/'});
 expect(entries.relay.variants.noun.label).toContain('接力');
 expect(entries.relay.variants.noun.pronunciationNote).toContain('动词');
 expect(entries.relay.variants.verb.label).toContain('传递');
 expect(entries.complex.ipa).toBe('/kəmˈplɛks/');
});
