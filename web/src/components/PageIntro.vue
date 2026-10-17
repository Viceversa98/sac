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
  gap: var(--space-2);
  min-width: 0;
}

.page-intro-title {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-xl);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.page-intro-purpose,
.page-intro-status {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-md);
  line-height: 1.5;
  color: var(--text-secondary);
  max-width: 68ch;
}

.page-intro-status {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.page-intro--compact .page-intro-title {
  font-size: var(--text-lg);
}

.page-intro--compact .page-intro-purpose,
.page-intro--compact .page-intro-status {
  font-size: var(--text-sm);
}

@media (max-width: 768px) {
  .page-intro-purpose,
  .page-intro--compact .page-intro-purpose {
    font-size: var(--text-md);
  }
}
</style>
