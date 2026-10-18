<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import TopHeader from './components/TopHeader.vue'
import ScenarioSimulatorBar from './components/ScenarioSimulatorBar.vue'
import AgentChatSidebar from './components/AgentChatSidebar.vue'
import ToastContainer from './components/ToastContainer.vue'

const route = useRoute()
const isSimulatorOpen = ref(false)
const isAgentOpen = ref(false)
const isViewportFit = computed(() => route.name === 'simulate')

const toggleSimulator = () => {
  isSimulatorOpen.value = !isSimulatorOpen.value
}

const toggleAgent = () => {
  isAgentOpen.value = !isAgentOpen.value
}

const handleCloseAgent = () => {
  isAgentOpen.value = false
}

const handleOpenAgent = () => {
  isAgentOpen.value = true
}

onMounted(() => {
  window.addEventListener('sampay-open-agent', handleOpenAgent)
})

onUnmounted(() => {
  window.removeEventListener('sampay-open-agent', handleOpenAgent)
})
</script>

<template>
  <div class="layout-wrapper" :class="{ 'layout-wrapper--fit': isViewportFit, 'layout-wrapper--agent': isAgentOpen }">
    <!-- Left Navigation Sidebar -->
    <Sidebar />

    <!-- Main Content Container with Fixed Top Header -->
    <div class="main-content-wrapper">
      <!-- Fixed Top Header Bar -->
      <TopHeader
        :simulator-open="isSimulatorOpen"
        :agent-open="isAgentOpen"
        @toggle-simulator="toggleSimulator"
        @toggle-agent="toggleAgent"
      />

      <!-- Content Area with proper top padding for fixed header -->
      <main class="page-body">
        <router-view />
      </main>
    </div>

    <!-- Floating Scenario Simulator Drawer -->
    <ScenarioSimulatorBar
      v-if="isSimulatorOpen"
      @close="isSimulatorOpen = false"
    />

    <AgentChatSidebar v-if="isAgentOpen" @close="handleCloseAgent" />

    <!-- Global Toast Container -->
    <ToastContainer />
  </div>
</template>

<style scoped>
.layout-wrapper {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-body);
}

.main-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-left: 250px;
}

.page-body {
  padding: 80px 32px 48px;
  flex: 1;
  max-width: 1440px;
  width: 100%;
}

.dashboard-full-view {
  display: flex;
  flex-direction: column;
}

.dashboard-operations-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 16px;
  margin-bottom: 16px;
  align-items: stretch;
}

@media (max-width: 1100px) {
  .dashboard-operations-grid {
    grid-template-columns: 1fr;
  }
}

.copilot-dedicated-view {
  width: 100%;
}

.copilot-page-container {
  max-width: 980px;
  margin: 0 auto;
}

.full-view-container {
  width: 100%;
}

@media (max-width: 1280px) {
  .main-content-wrapper {
    margin-left: 250px;
  }
}

.layout-wrapper--fit {
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}

.layout-wrapper--agent .main-content-wrapper {
  margin-right: 380px;
}

.layout-wrapper--agent :deep(.top-header-fixed) {
  right: 380px;
}

.layout-wrapper--fit .main-content-wrapper {
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  min-height: 0;
}

.layout-wrapper--fit .page-body {
  margin-top: 56px;
  height: calc(100vh - 56px);
  max-height: calc(100vh - 56px);
  padding: 8px 14px 10px;
  overflow: hidden;
  max-width: none;
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: none;
}

@media (max-width: 768px) {
  .layout-wrapper {
    flex-direction: column;
  }
  .main-content-wrapper {
    margin-left: 0;
  }
  .layout-wrapper--agent .main-content-wrapper {
    margin-right: 0;
  }
  .layout-wrapper--agent :deep(.top-header-fixed) {
    right: auto;
  }
  .page-body {
    padding: 16px 16px 32px;
  }
  .layout-wrapper--fit,
  .layout-wrapper--fit .main-content-wrapper,
  .layout-wrapper--fit .page-body {
    height: auto;
    max-height: none;
    overflow: visible;
  }
  .layout-wrapper--fit .page-body {
    margin-top: 0;
    padding: 12px;
  }
}
</style>
