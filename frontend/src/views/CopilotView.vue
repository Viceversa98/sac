<script setup>
import NlopsChat from '../components/NlopsChat.vue'
</script>

<template>
  <div class="copilot-dedicated-view">
    <div class="copilot-page-container">
      <NlopsChat />
    </div>
  </div>
</template>

<style scoped>
.copilot-dedicated-view {
  width: 100%;
}

.copilot-page-container {
  max-width: 980px;
  margin: 0 auto;
}
</style>
