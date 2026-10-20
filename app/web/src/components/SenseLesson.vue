<script setup lang="ts">
import {computed,ref, watch, useId} from 'vue';
import type {WordLesson, LessonUsage} from '../../../shared/lesson';
import {lessonWordParts} from '../lesson-text';

import SoundSpellingLesson from './SoundSpellingLesson.vue';

const props = defineProps<{lesson: WordLesson}>();
const usageLabels: Record<LessonUsage['kind'], string> = {
  'sentence-pattern': '句型',
  'common-collocation': '常见搭配',
  'fixed-expression': '固定表达',
};

const tabIdPrefix = useId();

defineEmits<{play:[]}>();
type TabId = 'sound-spelling' | (typeof TABS)[number]['id'];

const TABS = [
  {id: 'usage', label: '义项与用法'},
  {id: 'confusions', label: '近义与易混'},
  {id: 'etymology', label: '词根与词族'},
  {id: 'memory', label: '助记办法'},
  {id: 'extra', label: '再多了解一点'},
] as const;

const hasSoundSpelling=computed(()=>props.lesson.headword.toLowerCase()==='government');
const availableTabs=computed(()=>hasSoundSpelling.value?[{id:'sound-spelling' as const,label:'发音与拼写'},...TABS]:[...TABS]);
const activeTabId = ref<TabId>(availableTabs.value[0].id);

function wordParts(text: string) {
  return lessonWordParts(text, props.lesson);
}

function activateTab(tabId: TabId) {
  activeTabId.value = tabId;
}

function handleKeydown(event: KeyboardEvent, tabId: TabId) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const currentTarget = event.currentTarget as HTMLElement | null;
  if (!currentTarget?.parentElement?.querySelectorAll) return;

  const tabs = Array.from(currentTarget.parentElement.querySelectorAll<HTMLButtonElement>(`[role="tab"]`));
  if (tabs.length === 0) return;

  const currentIndex = tabs.findIndex(t => t.id === `${tabIdPrefix}-${tabId}`);
  if (currentIndex === -1) return;

  let newIndex = currentIndex;

  switch (event.key) {
    case 'ArrowLeft':
      newIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
      break;
    case 'ArrowRight':
      newIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
      break;
    case 'Home':
      newIndex = 0;
      break;
    case 'End':
      newIndex = tabs.length - 1;
      break;
    default:
      return;
  }

  event.preventDefault();
  const newTab = tabs[newIndex];
  newTab?.focus({preventScroll: true});
  activateTab(availableTabs.value[newIndex].id);
}

function handleTabClick(tabId: TabId) {
  activateTab(tabId);
}

watch(() => props.lesson.id, () => {
  activeTabId.value = availableTabs.value[0].id;
});

watch(() => props.lesson.wordId, () => {
  activeTabId.value = availableTabs.value[0].id;
});
</script>

<template>
  <div class="sense-lesson">
    <header class="lesson-intro">
      <p class="eyebrow">{{ lesson.partOfSpeech }} · {{ lesson.levelHint }}</p>
      <h2>{{ lesson.headline }}</h2>
      <p class="takeaway">{{ lesson.takeaway }}</p>
      <nav class="lesson-nav" role="tablist" aria-label="讲解内容">
        <button
          v-for="tab in availableTabs"
          :key="tab.id"
          :id="`${tabIdPrefix}-${tab.id}`"
          role="tab"
          type="button"
          :class="{active: activeTabId === tab.id}"
          :aria-selected="activeTabId === tab.id ? 'true' : 'false'"
          :aria-controls="`${tabIdPrefix}-${tab.id}-panel`"
          :tabindex="activeTabId === tab.id ? 0 : -1"
          @click="handleTabClick(tab.id)"
          @keydown="handleKeydown($event, tab.id)"
        >{{ tab.label }}</button>
      </nav>
    </header>

    <section v-if="activeTabId==='sound-spelling'" :id="`${tabIdPrefix}-sound-spelling-panel`" role="tabpanel" tabindex="0" :aria-labelledby="`${tabIdPrefix}-sound-spelling`"><SoundSpellingLesson @play="$emit('play')" /></section>

    <section
      v-if="activeTabId === 'usage'"
      :id="`${tabIdPrefix}-usage-panel`"
      role="tabpanel"
      tabindex="0"
      :aria-labelledby="`${tabIdPrefix}-usage`"
      class="core-senses"
      aria-label="核心义项与例句"
    >
      <article v-for="(sense, index) in lesson.senses" :key="sense.id" class="sense">
        <div class="sense-heading">
          <span class="sense-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <div><h3>{{ sense.title }}</h3><p class="meaning">{{ sense.meaning }}</p></div>
        </div>
        <p class="usage-note">{{ sense.usageNote }}</p>
        <ul class="example-list">
          <li v-for="example in sense.examples" :key="example.id">
            <p lang="en" class="en example"><template v-for="(part, i) in wordParts(example.en)" :key="i"><strong v-if="part.highlighted">{{ part.text }}</strong><template v-else>{{ part.text }}</template></template></p>
            <p class="translation">{{ example.zh }}</p>
            <p v-if="example.note" class="example-note">{{ example.note }}</p>
          </li>
        </ul>
        <div class="usage-list" aria-label="句型与搭配">
          <div v-for="item in [...sense.patterns, ...sense.collocations]" :key="`${item.kind}-${item.en}`" class="usage-row">
            <span class="usage-kind">{{ usageLabels[item.kind] }}</span>
            <div><p><b lang="en" class="en">{{ item.en }}</b><span class="usage-translation">{{ item.zh }}</span></p><p class="usage-detail">{{ item.note }}</p></div>
          </div>
        </div>
        <details class="relations" open>
          <summary>这个意思下的近义与反义表达</summary>
          <div class="relations-body">
            <div class="relation-group">
              <h4>近义表达 · 看区别</h4>
              <p v-if="sense.relatedExpressions.similarNote" class="relation-note">{{ sense.relatedExpressions.similarNote }}</p>
              <ul><li v-for="item in sense.relatedExpressions.similar" :key="item.en"><p><b lang="en" class="en">{{ item.en }}</b><span class="relation-translation">{{ item.zh }}</span></p><p class="relation-note">{{ item.note }}</p></li></ul>
            </div>
            <div class="relation-group contrasting">
              <h4>反义或相反表达 · 看语境</h4>
              <p v-if="sense.relatedExpressions.contrastingNote" class="relation-note">{{ sense.relatedExpressions.contrastingNote }}</p>
              <ul><li v-for="item in sense.relatedExpressions.contrasting" :key="item.en"><p><b lang="en" class="en">{{ item.en }}</b><span class="relation-translation">{{ item.zh }}</span></p><p class="relation-note">{{ item.note }}</p></li></ul>
            </div>
          </div>
        </details>
      </article>
    </section>

    <section
      v-if="activeTabId === 'confusions'"
      :id="`${tabIdPrefix}-confusions-panel`"
      role="tabpanel"
      tabindex="0"
      :aria-labelledby="`${tabIdPrefix}-confusions`"
      class="lesson-section"
    >
      <p class="section-kicker">分清用法</p><h2>容易混淆的地方</h2>
      <p v-if="!lesson.confusions.length" class="muted-copy">这个词先掌握上面的义项与用法即可，近义和相反表达见对应义项。</p>
      <details v-for="item in lesson.confusions" :key="item.id" class="reading-panel" open>
        <summary>{{ item.title }}</summary>
        <div class="panel-body">
          <p>{{ item.summary }}</p>
          <div v-for="contrast in item.items" :key="contrast.label" class="contrast-item">
            <h4>{{ contrast.label }}</h4><p class="muted-copy">{{ contrast.note }}</p>
            <p lang="en" class="en compact-example"><template v-for="(part, i) in wordParts(contrast.example.en)" :key="i"><strong v-if="part.highlighted">{{ part.text }}</strong><template v-else>{{ part.text }}</template></template></p>
            <p class="translation">{{ contrast.example.zh }}</p><p v-if="contrast.example.note" class="example-note">{{ contrast.example.note }}</p>
          </div>
          <p class="remember-line">{{ item.takeaway }}</p>
        </div>
      </details>
    </section>

    <section
      v-if="activeTabId === 'etymology'"
      :id="`${tabIdPrefix}-etymology-panel`"
      role="tabpanel"
      tabindex="0"
      :aria-labelledby="`${tabIdPrefix}-etymology`"
      class="lesson-section"
    >
      <p class="section-kicker">看懂单词的来处</p><h2>词根、词缀与词族</h2>
      <details class="reading-panel" open>
        <summary>词源与词根</summary>
        <div class="panel-body">
          <p>{{ lesson.etymology.summary }}</p>
          <ol v-if="lesson.etymology.stages.length" class="origin-chain">
            <li v-for="stage in lesson.etymology.stages" :key="`${stage.language}-${stage.form}`"><span class="origin-language">{{ stage.language }}</span><b lang="en" class="en">{{ stage.form }}</b><span>{{ stage.meaning }}</span></li>
          </ol>
          <p class="caveat">{{ lesson.etymology.caveat }}</p>
        </div>
      </details>
      <details class="reading-panel" open>
        <summary>词族 · 一起记，也看拼写变化</summary>
        <div class="panel-body family-list">
          <p v-if="lesson.wordFamilyNote" class="muted-copy">{{ lesson.wordFamilyNote }}</p>
          <article v-for="word in lesson.wordFamily" :key="word.word" class="family-item">
            <h4><span lang="en" class="en">{{ word.word }}</span><span class="word-pos">{{ word.partOfSpeech }}</span><span class="word-meaning">{{ word.meaning }}</span></h4>
            <p class="formation">{{ word.formation }}</p><p v-if="word.spellingNote" class="muted-copy">{{ word.spellingNote }}</p>
            <p lang="en" class="en compact-example">{{ word.example.en }}</p><p class="translation">{{ word.example.zh }}</p><p v-if="word.example.note" class="example-note">{{ word.example.note }}</p>
          </article>
        </div>
      </details>
    </section>

    <section
      v-if="activeTabId === 'memory'"
      :id="`${tabIdPrefix}-memory-panel`"
      role="tabpanel"
      tabindex="0"
      :aria-labelledby="`${tabIdPrefix}-memory`"
      class="lesson-section"
    >
      <p class="section-kicker">把意思连成画面</p><h2>助记办法</h2>
      <div class="memory-panel">
        <h3>{{ lesson.memoryAid.title }}</h3><p class="memory-story">{{ lesson.memoryAid.story }}</p>
        <ul class="memory-cues"><li v-for="cue in lesson.memoryAid.cues" :key="cue.label"><b>{{ cue.label }}</b><span>{{ cue.text }}</span></li></ul>
        <p class="caveat">{{ lesson.memoryAid.caveat }}</p>
      </div>
      <div class="study-plan"><h3>学完，试着说一说</h3><ol><li v-for="step in lesson.studyPlan" :key="step">{{ step }}</li></ol></div>
    </section>

    <section
      v-if="activeTabId === 'extra'"
      :id="`${tabIdPrefix}-extra-panel`"
      role="tabpanel"
      tabindex="0"
      :aria-labelledby="`${tabIdPrefix}-extra`"
      class="lesson-section extensions"
      aria-label="补充讲解"
    >
      <h2>再多了解一点</h2>
      <details class="reading-panel">
        <summary>发音与词形变化</summary>
        <div class="panel-body">
          <p class="phonetic-line"><span>英式 <b>{{ lesson.pronunciation.uk }}</b></span><span>美式 <b>{{ lesson.pronunciation.us }}</b></span></p>
          <p class="muted-copy">{{ lesson.pronunciation.accentNote }}</p>
          <ul class="plain-list"><li v-for="note in lesson.pronunciation.notes" :key="note">{{ note }}</li></ul>
          <dl class="forms-list"><div v-for="form in lesson.forms" :key="form.label"><dt>{{ form.label }}</dt><dd><b lang="en" class="en">{{ form.form }}</b><span class="form-ipa">{{ form.ipa }}</span><p>{{ form.note }}</p></dd></div></dl>
        </div>
      </details>
      <details v-if="lesson.lessCommonSenses.length" class="reading-panel">
        <summary>进阶义项 · 先认识，不必一次记完</summary>
        <div class="panel-body"><article v-for="sense in lesson.lessCommonSenses" :key="sense.id" class="less-common"><h3>{{ sense.title }}</h3><p>{{ sense.meaning }}</p><p class="muted-copy">{{ sense.note }}</p><p lang="en" class="en compact-example"><template v-for="(part, i) in wordParts(sense.example.en)" :key="i"><strong v-if="part.highlighted">{{ part.text }}</strong><template v-else>{{ part.text }}</template></template></p><p class="translation">{{ sense.example.zh }}</p><p v-if="sense.example.note" class="example-note">{{ sense.example.note }}</p></article></div>
      </details>
      <details v-if="lesson.sources.length" class="lesson-sources">
        <summary>参考资料</summary>
        <template v-for="group in ([{kind: 'verified', title: '已核对来源'}, {kind: 'recommended', title: '延伸阅读'}] as const)" :key="group.kind">
          <div v-if="lesson.sources.some(source => source.verification === group.kind)" class="source-group">
            <h4>{{ group.title }}</h4>
            <ul><li v-for="source in lesson.sources.filter(source => source.verification === group.kind)" :key="source.id"><a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.title }}</a><span>{{ source.supports.join('；') }}</span></li></ul>
          </div>
        </template>
      </details>
    </section>
  </div>
</template>

<style scoped>
.sense-lesson { color: var(--ink); line-height: 1.75; overflow-wrap: anywhere; }
.sense-lesson h2, .sense-lesson h3, .sense-lesson h4, .sense-lesson p { margin: 0; }
.sense-lesson h2 { font-size: 24px; line-height: 1.4; letter-spacing: -.03em; }
.sense-lesson h3 { font-size: 21px; line-height: 1.5; }
.sense-lesson h4 { font-size: 15px; line-height: 1.5; }
.en { font-family: var(--font-word); font-weight: 500; }
strong { color: var(--primary); font-weight: 650; }
.eyebrow, .section-kicker { color: var(--primary); font-size: 12px; font-weight: 650; letter-spacing: .04em; }
.lesson-intro .eyebrow { margin-bottom: 8px; }
.lesson-intro .takeaway { color: var(--ink-2); margin-top: 12px; font-size: 15px; }
.lesson-nav { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0 8px; }
.lesson-nav button { padding: 8px 14px; background: var(--surface-2); border: 1px solid var(--line); border-radius: 20px; color: var(--ink-2); font-size: 13px; font-weight: 500; cursor: pointer; min-height: 44px; }
@media (hover: hover) and (pointer: fine) {
  .lesson-nav button:not(:disabled):not([aria-selected="true"]):hover { background: var(--primary-soft); border-color: var(--core-line); }
}
.lesson-nav button[aria-selected="true"], .lesson-nav button.active { background: var(--primary); border-color: var(--primary); color: #fff; }
a:focus-visible, button:focus-visible, summary:focus-visible { outline: 2px solid var(--primary); outline-offset: 4px; }
.core-senses, .lesson-section { scroll-margin-top: 100px; }
.sense { padding: 30px 0 34px; border-bottom: 1px solid var(--line); }
.sense-heading { display: flex; align-items: flex-start; gap: 12px; }
.sense-number { flex: 0 0 34px; height: 34px; display: grid; place-items: center; background: var(--primary-soft); color: var(--primary); font-size: 13px; font-weight: 650; border-radius: 50%; margin-top: 2px; }
.meaning { color: var(--ink-2); font-size: 14px; margin-top: 4px !important; }
.usage-note { margin-top: 14px !important; font-size: 14px; }
.example-list { list-style: none; padding: 0 0 0 16px; margin: 22px 0; border-left: 3px solid var(--primary-soft); }
.example-list li + li { margin-top: 20px; }
.example { font-size: 22px; line-height: 1.55; }
.translation { color: var(--ink-2); font-size: 14px; line-height: 1.65; margin-top: 4px !important; }
.example-note { font-size: 12px; color: var(--ink-3); margin-top: 5px !important; }
.usage-list { padding: 4px 16px; background: var(--surface-2); border-radius: 10px; }
.usage-row { display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 10px; padding: 13px 0; }
.usage-row + .usage-row { border-top: 1px solid var(--line); }
.usage-kind { color: var(--ink-3); font-size: 11px; padding-top: 4px; }
.usage-row .en { font-size: 18px; color: var(--ink); }
.usage-translation { display: inline-block; margin-left: 12px; color: var(--ink-2); font-size: 13px; }
.usage-detail { font-size: 13px; color: var(--ink-2); margin-top: 3px !important; }
summary { cursor: pointer; list-style: none; position: relative; padding-right: 22px; }
summary::-webkit-details-marker { display: none; }
summary::after { content: '+'; position: absolute; right: 0; top: 0; font-size: 18px; font-weight: 400; color: var(--ink-3); }
details[open] > summary::after { content: '−'; }
.relations { margin-top: 18px; }
.relations > summary { color: var(--primary); font-size: 13px; font-weight: 600; padding-top: 4px; padding-bottom: 4px; }
.relations-body { margin-top: 12px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 22px; }
.relation-group h4 { color: var(--ink-2); font-size: 12px; }
.relation-group ul { list-style: none; padding: 0; margin: 10px 0 0; }
.relation-group li + li { margin-top: 14px; }
.relation-group .en { font-size: 18px; }
.relation-translation { font-size: 12px; color: var(--ink-2); display: inline-block; margin-left: 8px; }
.relation-note { margin-top: 3px !important; font-size: 13px; color: var(--ink-2); }
.lesson-section { margin-top: 36px; }
.section-kicker { margin-bottom: 5px !important; }
.lesson-section > h2 { margin-bottom: 18px; }
.reading-panel { border: 1px solid var(--line); border-radius: 10px; margin-top: 12px; }
.reading-panel > summary { padding: 15px 40px 15px 18px; font-size: 15px; font-weight: 600; line-height: 1.6; }
.reading-panel > summary::after { top: 12px; right: 17px; }
.panel-body { padding: 0 18px 19px; font-size: 14px; }
.contrast-item { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--line); }
.contrast-item h4 { margin-bottom: 4px; }
.muted-copy { font-size: 13px; color: var(--ink-2); }
.compact-example { font-size: 19px; line-height: 1.55; margin-top: 10px !important; }
.remember-line { color: var(--primary); background: var(--primary-soft); padding: 10px 12px; border-radius: 7px; margin-top: 18px !important; font-size: 13px; }
.origin-chain { list-style: none; margin: 20px 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 22px; }
.origin-chain li { display: flex; flex-direction: column; position: relative; min-width: 0; max-width: 100%; padding-right: 4px; }
.origin-chain li:not(:last-child)::after { content: '→'; position: absolute; right: -14px; top: 29px; color: var(--ink-3); }
.origin-chain .en { font-size: 22px; }
.origin-language { font-size: 11px; color: var(--ink-3); }
.origin-chain li > span:last-child { font-size: 12px; color: var(--ink-2); }
.caveat { font-size: 12px; color: var(--ink-2); padding-top: 12px; border-top: 1px solid var(--line); }
.family-item + .family-item { border-top: 1px solid var(--line); padding-top: 18px; margin-top: 18px; }
.family-item h4 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; }
.family-item h4 .en { font-size: 22px; color: var(--primary); }
.word-pos { color: var(--ink-3); font-size: 12px; font-weight: 400; }
.word-meaning { font-size: 14px; font-weight: 500; }
.formation { margin-top: 7px !important; }
.memory-panel { border-left: 3px solid var(--primary); background: var(--surface-2); padding: 20px; border-radius: 0 10px 10px 0; }
.memory-panel h3 { font-size: 18px; }
.memory-story { margin-top: 9px !important; font-size: 14px; }
.memory-cues { list-style: none; padding: 0; margin: 18px 0; }
.memory-cues li { margin-top: 10px; }
.memory-cues b { display: block; font-size: 13px; color: var(--primary); }
.memory-cues span { font-size: 13px; color: var(--ink-2); }
.study-plan { margin-top: 22px; }
.study-plan h3 { font-size: 16px; }
.study-plan ol { padding-left: 22px; margin: 10px 0 0; font-size: 14px; }
.study-plan li { padding-left: 3px; margin-top: 8px; }
.study-plan li::marker { color: var(--primary); font-weight: 600; }
.extensions > h2 { font-size: 20px; }
.phonetic-line { display: flex; flex-wrap: wrap; gap: 7px 20px; font-size: 13px; }
.phonetic-line b { color: var(--ink); font-weight: 500; }
.plain-list { padding-left: 20px; font-size: 13px; color: var(--ink-2); margin: 10px 0 20px; }
.forms-list { margin: 0; }
.forms-list > div { display: grid; grid-template-columns: 84px minmax(0, 1fr); gap: 12px; padding: 12px 0; border-top: 1px solid var(--line); }
.forms-list dt { font-size: 12px; color: var(--ink-2); padding-top: 3px; }
.forms-list dd { margin: 0; }
.forms-list .en { font-size: 20px; }
.form-ipa { font-size: 13px; margin-left: 10px; color: var(--ink-2); }
.forms-list dd p { font-size: 12px; color: var(--ink-2); margin-top: 3px; }
.less-common + .less-common { padding-top: 18px; margin-top: 18px; border-top: 1px solid var(--line); }
.less-common h3 { font-size: 16px; margin-bottom: 5px; }
.lesson-sources { margin-top: 30px; padding-top: 16px; border-top: 1px solid var(--line); color: var(--ink-3); font-size: 12px; }
.source-group { margin-top: 14px; }
.source-group h4 { font-size: 12px; color: var(--ink-2); }
.lesson-sources ul { padding-left: 16px; margin-bottom: 0; }
.lesson-sources li + li { margin-top: 10px; }
.lesson-sources a { color: var(--ink-2); text-decoration-color: var(--line); text-underline-offset: 3px; }
.lesson-sources span { display: block; font-size: 11px; margin-top: 2px; }
@media (max-width: 600px) {
  .origin-chain { grid-template-columns: 1fr; gap: 28px; }
  .origin-chain li:not(:last-child)::after { content: '↓'; top: auto; right: auto; left: 0; bottom: -24px; }
  .sense-lesson h2 { font-size: 22px; }
  .sense-lesson h3 { font-size: 19px; }
  .lesson-nav { gap: 7px; }
  .lesson-nav button { flex: 1 1 40%; text-align: center; padding: 8px 6px; }
  .sense { padding-top: 26px; }
  .sense-heading { gap: 9px; }
  .sense-number { flex-basis: 29px; height: 29px; font-size: 11px; }
  .example-list { padding-left: 12px; }
  .example { font-size: 20px; }
  .usage-list { padding: 3px 12px; }
  .usage-row { grid-template-columns: minmax(0, 1fr); gap: 1px; }
  .usage-kind { padding-top: 0; }
  .usage-translation { margin-left: 0; display: block; }
  .relations-body { grid-template-columns: minmax(0, 1fr); gap: 20px; }
  .contrasting { padding-top: 14px; border-top: 1px dashed var(--line); }
  .reading-panel > summary { padding-left: 14px; }
  .panel-body { padding-left: 14px; padding-right: 14px; }
  .origin-chain { gap: 16px; flex-direction: column; }
  .origin-chain li { padding-left: 16px; border-left: 2px solid var(--line); }
  .origin-chain li:not(:last-child)::after { content: none; }
  .memory-panel { padding: 16px; }
  .forms-list > div { grid-template-columns: minmax(0, 1fr); gap: 2px; }
  .form-ipa { display: inline-block; }
}
</style>
