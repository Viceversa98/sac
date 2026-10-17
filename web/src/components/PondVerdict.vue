<script setup>
const props = defineProps({
  assessment: {
    type: Object,
    required: true
  },
  hideWord: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div class="verdict">
    <p v-if="!props.hideWord" class="verdict-word" :class="`verdict-word--${props.assessment.verdict.toLowerCase()}`">
      {{ props.assessment.verdict }}
    </p>
    <p class="verdict-reason">{{ props.assessment.reason }}</p>
    <ul class="metric-list">
      <li v-for="item in props.assessment.cardMetrics" :key="item.id">
        <span class="metric-label">{{ item.label }}</span>
        <span class="metric-value">{{ item.value }}</span>
        <span class="metric-call" :class="`metric-call--${item.level}`">{{ item.call }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.verdict {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.verdict-word {
  margin: 0;
  align-self: flex-start;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.3;
}

.verdict-word--healthy {
  background: var(--emerald-50);
  color: var(--emerald-800);
}

.verdict-word--watch {
  background: var(--amber-50);
  color: var(--amber-800);
}

.verdict-word--unhealthy {
  background: var(--rose-50);
  color: var(--rose-800);
}

.verdict-reason {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}

.metric-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  min-width: 0;
}

.metric-list li {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) auto;
  gap: 4px 8px;
  align-items: baseline;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
  min-width: 0;
}

.metric-label,
.metric-value,
.metric-call {
  min-width: 0;
  overflow-wrap: anywhere;
}

.metric-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.metric-value {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
}

.metric-call {
  font-size: 0.875rem;
  font-weight: 700;
  text-align: right;
  color: var(--text-primary);
}

.metric-call--ok {
  color: var(--emerald-800);
}

.metric-call--watch {
  color: var(--amber-800);
}

.metric-call--unhealthy {
  color: var(--rose-800);
}

.metric-call--recorded {
  color: var(--text-secondary);
}

@media (max-width: 420px) {
  .metric-list li {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .metric-label {
    grid-column: 1 / -1;
  }
}
</style>
