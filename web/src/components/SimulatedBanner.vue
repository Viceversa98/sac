<script setup>
// Always visible. This component accepts no props, so nothing can hide the label.
</script>

<template>
  <p class="simulated-banner" role="status">
    <strong>Simulated</strong>
    <span>Sensor feed and proposed actions on this screen are simulated.</span>
  </p>
</template>

<style scoped>
.simulated-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-medium);
  background: var(--bg-surface);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: 1.4;
}

.simulated-banner strong {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
}
</style>
