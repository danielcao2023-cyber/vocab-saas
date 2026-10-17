<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { api, OfflineError, speak } from './api';
import { PendingSubmitter } from './pending';

type View = 'home' | 'study' | 'done' | 'progress' | 'wrong';
interface Card { id: number; word_id: number; mode: 'recognize' | 'spell' | 'dictation'; headword: string; phonetic: string | null; meaning_zh: string | null; meaning_flag: string | null; is_sample: number; state: number }

const view = ref<View>('home');
const online = ref(true);
const today = ref<{ review: number; new: number; minutes: number } | null>(null);
const lists = ref<any[]>([]);
const wrong = ref<any[]>([]);
const isSample = computed(() => lists.value.some((l) => l.isSample));

const card = ref<Card | null>(null);
const revealed = ref(false);
const answer = ref('');
const usedHint = ref(false);
const feedback = ref<{ correct: boolean; expected: string; inBook: boolean } | null>(null);
const shownAt = ref(0);
const session = ref({ done: 0, correct: 0 });
const prefer = ref<'review' | 'new'>('review');
const practiceQueue = ref<Card[] | null>(null);
const noAudio = ref(false);
const input = ref<HTMLInputElement | null>(null);
const submitter = new PendingSubmitter((path, body) => api(path, body));
const unsaved = ref(false);       // 当前卡的答案没存上
const pendingRating = ref(0);
const showMore = ref(false);
const senses = computed(() => (card.value?.meaning_zh ?? '').split('\n').filter(Boolean));

const RATINGS = [
  { v: 1, label: '忘了' }, { v: 2, label: '模糊' }, { v: 3, label: '认识' }, { v: 4, label: '很熟' },
];

async function guard<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try { const r = await fn(); online.value = true; return r; }
  catch (e) { if (e instanceof OfflineError) { online.value = false; return undefined; } throw e; }
}

async function ping() {
  const was = online.value;
  try { const r = await fetch('/health'); online.value = r.ok; } catch { online.value = false; }
  if (online.value && submitter.failed && (!was || unsaved.value)) {
    const r = await submitter.onReconnect();
    if (r) await afterSaved(r);
  }
}

async function loadHome() {
  await guard(async () => {
    today.value = await api('/api/today');
    lists.value = (await api('/api/progress')).lists;
    wrong.value = (await api('/api/wrong')).items;
  });
}

function go(v: View) { view.value = v; if (v === 'home' || v === 'progress' || v === 'wrong') loadHome(); }

async function start(p: 'review' | 'new') {
  prefer.value = p; practiceQueue.value = null; session.value = { done: 0, correct: 0 };
  view.value = 'study'; await loadNext();
}
async function startPractice() {
  const r = await guard(() => api('/api/wrong/practice'));
  if (!r) return;
  practiceQueue.value = r.cards; session.value = { done: 0, correct: 0 }; view.value = 'study'; await loadNext();
}

async function loadNext() {
  showMore.value = false; unsaved.value = false;
  revealed.value = false; answer.value = ''; usedHint.value = false; feedback.value = null; noAudio.value = false;
  let c: Card | null | undefined;
  if (practiceQueue.value) c = practiceQueue.value.shift() ?? null;
  else { const r = await guard(() => api(`/api/next?prefer=${prefer.value}`)); if (!r) return; c = r.card; }
  card.value = c ?? null;
  if (!c) { view.value = 'done'; return; }
  shownAt.value = Date.now();
  if (c.mode === 'dictation') play();
  if (c.mode !== 'recognize') { await nextTick(); input.value?.focus(); }
}

function play() {
  if (!card.value) return;
  noAudio.value = !speak(card.value.headword);
}

/** 答案存上之后：认词卡前进；拼写/听写卡显示判定 */
async function afterSaved(r: any) {
  unsaved.value = false; online.value = true;
  if (!card.value) return;
  if (card.value.mode === 'recognize') {
    session.value.done++; if (pendingRating.value > 1) session.value.correct++;
    await loadNext();
  } else {
    session.value.done++; if (r.correct) session.value.correct++;
    feedback.value = { correct: r.correct, expected: r.expected, inBook: !r.correct };
  }
}

async function rate(v: number) {
  if (!card.value || !revealed.value) return;
  pendingRating.value = v;
  const r = unsaved.value ? await submitter.retry({ rating: v })
    : await submitter.submit('/api/review', { cardId: card.value.id, rating: v, durationMs: Date.now() - shownAt.value });
  if (!r) { unsaved.value = true; online.value = false; return; }
  await afterSaved(r);
}

async function submit() {
  if (!card.value) return;
  if (feedback.value) { await loadNext(); return; }
  if (!answer.value.trim()) return;
  const r = unsaved.value ? await submitter.retry()
    : await submitter.submit('/api/check', { cardId: card.value.id, answer: answer.value, usedHint: usedHint.value });
  if (!r) { unsaved.value = true; online.value = false; return; }
  await afterSaved(r);
}

function hint() {
  if (!card.value || feedback.value) return;
  usedHint.value = true;
  const first = card.value.headword[0];
  if (!answer.value.startsWith(first)) answer.value = first + answer.value;
}

async function toggleWrong(wordId: number, inBook: boolean) {
  await guard(() => api(`/api/wrong/${wordId}`, { inBook })); await loadHome();
}

function onKey(e: KeyboardEvent) {
  if (view.value !== 'study' || !card.value) return;
  const c = card.value;
  if (c.mode === 'recognize') {
    if (!revealed.value && (e.key === 'ArrowRight' || e.key === 'Enter')) { revealed.value = true; e.preventDefault(); }
    else if (e.key === ' ') { play(); e.preventDefault(); }
    else if (revealed.value && ['1', '2', '3', '4'].includes(e.key)) rate(Number(e.key));
  } else {
    if (e.key === 'Tab') { hint(); e.preventDefault(); }
    else if (e.key === 'Enter') { submit(); e.preventDefault(); }
    else if ((e.key === 'r' || e.key === 'R') && (c.mode === 'dictation') && (e.ctrlKey || e.altKey || feedback.value || document.activeElement !== input.value)) { play(); e.preventDefault(); }
  }
  if (e.key === 'Escape') go('home');
}

let timer: number | undefined;
let fast: number | undefined;
onMounted(() => {
  loadHome();
  timer = window.setInterval(ping, 30_000);
  fast = window.setInterval(() => { if (unsaved.value) ping(); }, 5_000); // 有没存上的答案时 5 秒探测一次
  window.addEventListener('online', ping);
  window.addEventListener('keydown', onKey);
});
onUnmounted(() => { clearInterval(timer); clearInterval(fast); window.removeEventListener('online', ping); window.removeEventListener('keydown', onKey); });

const accuracy = computed(() => session.value.done ? Math.round((session.value.correct / session.value.done) * 100) : 0);
const modeLabel = { recognize: '认词', spell: '拼写', dictation: '听写' };
</script>

<template>
  <div class="wrap">
    <div v-if="!online" class="offline" role="alert">
      连不上学习服务。如果不在家，请先打开 Tailscale；在家的话请家长看一下 Studio 是否开机。
      <button @click="ping(); loadHome()">重试</button>
    </div>
    <div v-if="isSample" class="sample">当前是示例数据（开发测试用），不是课标词表。</div>

    <nav>
      <button :class="{ on: view === 'home' }" @click="go('home')">今日</button>
      <button :class="{ on: view === 'progress' }" @click="go('progress')">进度</button>
      <button :class="{ on: view === 'wrong' }" @click="go('wrong')">错词本</button>
    </nav>

    <section v-if="view === 'home'">
      <h1 v-if="today">今天：复习 {{ today.review }} 个 · 新词 {{ today.new }} 个 · 约 {{ today.minutes }} 分钟</h1>
      <div class="row">
        <button class="primary" @click="start('review')">开始复习</button>
        <button @click="start('new')">先学新词</button>
      </div>
      <p class="muted" v-if="wrong.length">错词本 {{ wrong.length }} 个。<a href="#" @click.prevent="go('wrong')">去看看</a></p>
    </section>

    <section v-if="view === 'study' && card" class="card">
      <div class="muted">{{ modeLabel[card.mode] }}</div>

      <template v-if="card.mode === 'recognize'">
        <div class="word">{{ card.headword }} <button class="icon" title="听发音（空格）" @click="play">🔊</button></div>
        <div class="phon">{{ card.phonetic ?? '（暂无音标）' }}</div>
        <p v-if="!revealed" class="muted">空格 听发音 · → 翻面 · 先自己想想意思再翻面</p>
        <button v-if="!revealed" @click="revealed = true">翻面</button>
        <template v-else>
          <div class="meaning">
            <div v-for="(m, i) in senses.slice(0, 2)" :key="i">{{ m }}</div>
            <div v-if="!senses.length">（暂无释义）</div>
            <p v-if="card.meaning_flag" class="warn small">{{ card.meaning_flag }}</p>
            <template v-if="senses.length > 2">
              <button class="link" @click="showMore = !showMore">{{ showMore ? '收起' : '更多释义' }}（{{ senses.length - 2 }}）</button>
              <div v-if="showMore" class="more"><div v-for="(m, i) in senses.slice(2)" :key="i">{{ m }}</div></div>
            </template>
          </div>
          <div class="row">
            <button v-for="r in RATINGS" :key="r.v" @click="rate(r.v)">{{ r.v }} {{ r.label }}</button>
          </div>
          <p v-if="unsaved" class="bad small" role="status">这张没存上，连上后会自动补存</p>
        </template>
      </template>

      <template v-else>
        <template v-if="card.mode === 'spell'">
          <div class="meaning"><div v-for="(m, i) in senses.slice(0, 2)" :key="i">{{ m }}</div></div>
          <div class="phon">{{ card.phonetic }}</div>
        </template>
        <template v-else>
          <p>戴上耳机，听发音后拼写。 <button class="icon" @click="play">🔊</button></p>
          <p class="muted">按 R 重听（不限次数）（输入框里用 Ctrl+R 或点 🔊）</p>
          <p v-if="noAudio" class="warn">没听到声音？检查耳机或音量。</p>
        </template>
        <input ref="input" v-model="answer" :disabled="!!feedback || unsaved" autocomplete="off" spellcheck="false" placeholder="输入单词" />
        <p class="muted">Tab 提示首字母 · Enter 提交</p>
        <p v-if="unsaved" class="bad small" role="status">这张没存上，连上后会自动补存 <button @click="submit">再试一次</button></p>
        <div v-if="feedback">
          <p v-if="feedback.correct" class="ok">正确 ✓</p>
          <p v-else class="bad">应为：<b>{{ feedback.expected }}</b>（你写的是 {{ answer }}）。已加入错词本。</p>
          <div v-if="card.mode === 'dictation'" class="meaning"><div v-for="(m, i) in senses.slice(0, 2)" :key="i">{{ m }}</div></div>
          <button @click="loadNext">下一个（Enter）</button>
        </div>
      </template>
      <p class="muted small">1–4 选项 · Enter 确认 · R 重听 · Esc 暂停</p>
    </section>

    <section v-if="view === 'done'">
      <h1>今天完成 {{ session.done }} 题，正确率 {{ accuracy }}%。</h1>
      <p class="muted">这一轮没有更多到期的卡了。</p>
      <button @click="go('home')">回首页</button>
    </section>

    <section v-if="view === 'progress'">
      <h1>进度（按词表）</h1>
      <div v-for="l in lists" :key="l.source" class="list">
        <h2>{{ l.source === 'kb2022' ? '课标词表' : l.source }}<span v-if="l.isSample">（示例数据）</span>：已掌握 {{ l.mastered }}/{{ l.total }}</h2>
        <div class="bar">
          <span class="m" :style="{ flex: l.mastered }"></span><span class="f" :style="{ flex: l.familiar }"></span>
          <span class="l" :style="{ flex: l.learning }"></span><span class="n" :style="{ flex: l.new }"></span>
        </div>
        <p class="muted">掌握 {{ l.mastered }} · 熟悉 {{ l.familiar }} · 学习中 {{ l.learning }} · 新词 {{ l.new }}</p>
      </div>
    </section>

    <section v-if="view === 'wrong'">
      <h1>错词本 {{ wrong.length }} 个</h1>
      <button v-if="wrong.length" class="primary" @click="startPractice">练这 {{ Math.min(10, wrong.length) }} 个</button>
      <table v-if="wrong.length">
        <tr><th>单词</th><th>释义</th><th>错</th><th>本轮跨天答对</th><th></th></tr>
        <tr v-for="w in wrong" :key="w.word_id">
          <td><b>{{ w.headword }}</b> <span class="muted">{{ w.phonetic }}</span></td>
          <td class="small">{{ (w.meaning_zh ?? '').split('\n')[0] }}</td>
          <td>{{ w.wrong_count }}</td><td>{{ w.correct_days }}/3</td>
          <td><button @click="toggleWrong(w.word_id, false)">移出</button></td>
        </tr>
      </table>
      <p v-else class="muted">错词本是空的。</p>
    </section>
  </div>
</template>

<style>
body { font-family: -apple-system, "PingFang SC", sans-serif; margin: 0; background: #f6f7f9; color: #222; }
.wrap { max-width: 760px; margin: 0 auto; padding: 16px; }
nav { display: flex; gap: 8px; margin-bottom: 16px; }
button { font-size: 15px; padding: 8px 14px; border: 1px solid #ccd; background: #fff; border-radius: 8px; cursor: pointer; }
button.on, button.primary { background: #2f6fde; color: #fff; border-color: #2f6fde; }
button.icon { border: none; background: none; font-size: 22px; padding: 0 4px; }
.row { display: flex; gap: 10px; flex-wrap: wrap; margin: 12px 0; }
.card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 1px 4px #0001; }
.word { font-size: 42px; font-weight: 600; }
.phon { color: #555; font-size: 18px; margin: 6px 0 12px; }
.link { border: none; background: none; color: #2f6fde; padding: 4px 0; font-size: 14px; }
.more { color: #445; font-size: 16px; }
.meaning { font-family: inherit; font-size: 18px; white-space: pre-wrap; margin: 12px 0; }
input { font-size: 24px; padding: 8px 12px; width: 100%; box-sizing: border-box; border-radius: 8px; border: 1px solid #bbc; }
.muted { color: #778; } .small { font-size: 13px; }
.ok { color: #1a8a3a; font-size: 20px; } .bad { color: #b3261e; font-size: 18px; } .warn { color: #a66300; }
.offline { background: #fde7e7; color: #8a1c1c; padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; }
.sample { background: #fff4d6; color: #7a5600; padding: 6px 12px; border-radius: 8px; margin-bottom: 12px; font-size: 14px; }
.bar { display: flex; height: 14px; border-radius: 7px; overflow: hidden; background: #e4e6ea; }
.bar .m { background: #1a8a3a; } .bar .f { background: #7cc48b; } .bar .l { background: #f0b429; } .bar .n { background: #d5d8de; }
table { width: 100%; border-collapse: collapse; margin-top: 12px; } td, th { border-bottom: 1px solid #e3e5ea; padding: 6px; text-align: left; }
</style>
