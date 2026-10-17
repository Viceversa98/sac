<script setup>
import NlopsChat from '../components/NlopsChat.vue'
import SimulatedBanner from '../components/SimulatedBanner.vue'
import PageIntro from '../components/PageIntro.vue'
</script>

<template>
  <div class="copilot-dedicated-view">
    <div class="copilot-page-container">
      <SimulatedBanner />
      <PageIntro
        title="Co-pilot"
        purpose="Ask what a pond needs. Approve writes a log and does not control equipment."
      />
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
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
