<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: ''
  },
  compact: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <header class="page-intro" :class="{ 'page-intro--compact': compact }">
    <h1 class="page-intro-title">{{ title }}</h1>
    <p class="page-intro-purpose">{{ purpose }}</p>
    <p v-if="status" class="page-intro-status">{{ status }}</p>
  </header>
</template>

<style scoped>
.page-intro {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.page-intro-title {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-primary);
}

.page-intro-purpose,
.page-intro-status {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 0.92rem;
  line-height: 1.45;
  color: var(--text-secondary);
}

.page-intro--compact .page-intro-title {
  font-size: 1.05rem;
}

.page-intro--compact .page-intro-purpose {
  font-size: 0.82rem;
}
</style>
