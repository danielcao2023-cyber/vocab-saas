<script setup lang="ts">
import { computed, useId } from 'vue'
import type { VocabularySelection, VocabularyBook } from '../../../shared/vocabulary'

const props = defineProps<{
  modelValue: VocabularySelection
  books: VocabularyBook[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [VocabularySelection]
}>()

const prefix=useId();
const selectedBookId = computed(()=>props.modelValue.bookId)

const groupedBooks = computed(() => {
  const core: VocabularyBook[] = []
  const high: VocabularyBook[] = []
  const exam: VocabularyBook[] = []

  props.books.forEach(book => {
    if (book.category === 'core') core.push(book)
    else if (book.category === 'high') high.push(book)
    else if (book.category === 'exam') exam.push(book)
  })

  return { core, high, exam }
})

const currentBook = computed(()=>props.books.find(b=>b.id===props.modelValue.bookId))

const selectedUnitId = computed({
  get: () => props.modelValue.unitId ?? '',
  set: (unitId) => {
    emit('update:modelValue', { bookId: props.modelValue.bookId, unitId:unitId||null })
  }
})

const selectedWordCount = computed(() => {
  if (props.modelValue.unitId === null) {
    return currentBook.value?.wordCount ?? 0
  }
  const unit = currentBook.value?.units.find(u => u.id === props.modelValue.unitId)
  return unit?.wordCount ?? 0
})

function handleBookChange(event: Event) {
  const newBookId = (event.target as HTMLSelectElement).value
  const book = props.books.find(b => b.id === newBookId)
  if (book) {
    emit('update:modelValue', { bookId: book.id, unitId: null })
  }
}
</script>

<template>
  <div class="vocab-picker">
    <div class="control-group">
      <label :for="`${prefix}-vocabulary-book`" class="label">学习词书</label>
      <select
        :id="`${prefix}-vocabulary-book`" aria-label="学习词书"
        :value="selectedBookId"
        @change="handleBookChange"
        :disabled="disabled"
        class="control"
      >
        <template v-for="(books, category) in groupedBooks" :key="category">
          <optgroup :label="category === 'core' ? '初中' : category === 'high' ? '人教高中' : '考试词汇'">
            <option v-for="book in books" :key="book.id" :value="book.id">
              {{ book.title }}（{{ book.wordCount }}词）
            </option>
          </optgroup>
        </template>
      </select>
    </div>

    <div v-if="currentBook?.units?.length" class="control-group">
      <label :for="`${prefix}-vocabulary-unit`" class="label">学习单元</label>
      <select
        :id="`${prefix}-vocabulary-unit`" aria-label="学习单元"
        v-model="selectedUnitId"
        :disabled="disabled"
        class="control"
      >
        <option value="">全册单元</option>
        <option v-for="unit in currentBook.units" :key="unit.id" :value="unit.id">
          {{ unit.title }}（{{ unit.wordCount }}词）
        </option>
      </select>
    </div>

    <footer class="footer">
      <span class="footer-text">{{ currentBook?.edition }} · {{ selectedWordCount }}词</span>
    </footer>
  </div>
</template>

<style scoped>
.vocab-picker {
  width: 100%;
  padding: 12px;
  background-color: var(--surface-2);
  border-radius: 4px;
}

.control-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}

.label {
  font-size: 0.875rem;
  color: var(--ink-3);
  margin-bottom: 4px;
}

.control {
  width: 100%;
  padding: 8px 12px;
  font-size: 0.9375rem;
  color: var(--ink);
  background-color: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 4px;
  outline: none;
}

.control:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent);
}

.control:disabled {
  opacity: 0.6;
}

.footer {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--line);
}

.footer-text {
  font-size: 0.75rem;
  color: var(--ink-2);
}
</style>

