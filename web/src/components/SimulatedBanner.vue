<script setup>
// Always visible. This component accepts no props, so nothing can hide the label.
</script>

<template>
  <p class="simulated-banner" role="status">
    <strong>SIMULATED / SIMULASI</strong>
    <span>Sensor feed and proposed actions on this screen are simulated.</span>
  </p>
</template>

<style scoped>
.simulated-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--amber-600);
  background: var(--amber-50);
  color: var(--amber-700);
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.35;
}

.simulated-banner strong {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
</style>
